import { create } from '@waves/node-api-js'
import { useQuery } from 'react-query'
import { Icon, TableContainer, Thead, Td, Th, Tbody, Tr, Table, Box, Text, VStack, StackDivider, LinkBox, LinkOverlay, SimpleGrid, Stat, StatLabel, StatNumber } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useTable, useSortBy } from 'react-table'
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons'
import { Link } from 'react-router-dom'
import _ from 'lodash'
import BigNumber from 'bignumber.js'
import { compareAsc, format, minutesToMilliseconds } from 'date-fns'

const toDisplay = (num) => {
    return new BigNumber(num).div(Math.pow(10, 8)).toNumber()
}

const statFont = ['md', null, '2xl']

const api = create('https://nodes.wavesnodes.com')

const blockDateSort = (a, b, id, desc) => {
	const dateA = a.original[id].timestamp
	const dateB = b.original[id].timestamp
	return compareAsc(dateA, dateB)
}

const Mining = () => {
	const { error, data } = useQuery('mining', async () => {
        const [height, groups] = await Promise.all([
            api.blocks.fetchHeight().then(d => d.height),
            api.addresses.data('3PC9BfRwJWWiw9AREE2B3eWzCks3CYtg4yo', { matches: encodeURIComponent(`^%s%d%s__leaseGroup__\\d+__nodeList$`) })
        ])
        const addresses = new Set(groups.map(({ key, value }) => value.split('__')).flat())
        const end = height - 1
        const fetchers = _.range(0, 14).map((i) => {
            return api.blocks.fetchHeadersSeq(end - (i * 100) - 99, end - (i * 100))
        })
        fetchers.push(
            api.blocks.fetchHeadersSeq(end - 1440, end - 1400)
        )
        const headers = await Promise.all(fetchers).then(d => d.map(seq => Array.from(seq).reverse()).flat())
        const withReward = headers.map((header, i, arr) => {
            const reward = new BigNumber(header.reward)
            const feeReward = new BigNumber(header.totalFee).times(0.4).dp(0)
            const prevFeeReward = new BigNumber(arr?.[i + 1]?.totalFee || 0).times(0.6).dp(0)

            return {
                ...header,
                totalEarned: reward.plus(feeReward).plus(prevFeeReward).toNumber()
            }
        }).slice(0, -1)
        const byProgram = withReward.filter(header => addresses.has(header.generator))
        const totalWavesMined = byProgram.reduce((total, block) => {
            return total.plus(block.totalEarned)
        }, new BigNumber(0)).toNumber()
        const blocksByAddress = _.groupBy(byProgram, (header) => header.generator)
        const totalBlocks = byProgram.length
        const addressData = _.map(blocksByAddress, (val, key) => {
            const lastBlock = val[0]
            const totalMined = val.reduce((total, block) => {
                return total.plus(block.totalEarned)
            }, new BigNumber(0)).toNumber()
            const commission = new BigNumber(totalMined).times(0.05).dp(0).toNumber()
            const numBlocks = val.length
            return {
                node: key,
                lastBlock,
                totalMined,
                commission,
                numBlocks
            }
        })

        return {
            totalBlocks,
            totalWavesMined,
            addressData,
            totalAddresses: addresses.size,
            totalWithBlock: addressData.length,
            current: headers[0].timestamp
        }
	}, { staleTime: minutesToMilliseconds(30), refetchInterval: minutesToMilliseconds(10) })

	const memoData = useMemo(() => {
		return data?.addressData || []
	}, [data])

	const columns = useMemo(() => {
		return [
            { Header: 'Node', accessor: 'node', disableSortBy: true },
            { Header: 'Waves Mined', accessor: 'totalMined', Cell: ({ value }) => toDisplay(value) },
            { Header: 'Owner Commission', accessor: 'commission', Cell: ({ value }) => toDisplay(value) },
            { Header: 'Blocks', accessor: 'numBlocks' },
            { Header: 'Last Block At', sortType: blockDateSort, accessor: 'lastBlock', Cell: ({ value }) => `${format(value.timestamp, 'yyyy-MM-dd, HH:mm')}` }
		]
	}, [])
	
	const {
		headerGroups,
		rows,
		prepareRow
	} = useTable({ columns, data: memoData, autoResetSortBy: false, initialState: { sortBy: [{ id: 'numBlocks', desc: true }]} }, useSortBy)

	return (
		<>
            <VStack p={5} align='stretch' spacing={3} divider={<StackDivider/>}>
                <Box>
                    <Text fontSize='2xl' as='h1' fontWeight='semibold' mb={3}>Mining Stats (Past 24 Hours)</Text>
                    {error && <Text>Could not load data</Text>}
                    {(!error && memoData.length === 0) && <Text>Loading...</Text>}
                    {data && <Text>As of {format(data.current, 'yyyy-MM-dd, HH:mm')}</Text>}
                    {memoData.length > 0 &&
                        <SimpleGrid columns={[1, null, 4]} spacing={[1, null, 5]} mt={2}>
                            <Stat>
                                <StatLabel>Total Waves Mined</StatLabel>
                                <StatNumber fontSize={statFont}>{toDisplay(data.totalWavesMined)}</StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel># Blocks Generated</StatLabel>
                                <StatNumber fontSize={statFont}>{data.totalBlocks}</StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>Nodes That Generated &gt;= 1 Block</StatLabel>
                                <StatNumber fontSize={statFont}>{data.totalWithBlock}/{data.totalAddresses}</StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>Average Blocks Per Node</StatLabel>
                                <StatNumber fontSize={statFont}>{new BigNumber(data.totalBlocks).div(data.totalAddresses).dp(2).toNumber()}</StatNumber>
                            </Stat>
                        </SimpleGrid>
                    }
                </Box>
                {data &&
                    <TableContainer>
                        <Table variant='simple'>
                            <Thead>
                                {headerGroups.map(headerGroup => (
                                    <Tr>
                                        {headerGroup.headers.map(column => (
                                            <Th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                                {column.render('Header')}
                                                <span>
                                                    {column.isSorted
                                                    ? column.isSortedDesc
                                                        ? <Icon ml={2} as={TriangleDownIcon}/>
                                                        : <Icon ml={2} as={TriangleUpIcon}/>
                                                    : ''}
                                                </span>
                                            </Th>
                                        ))}
                                    </Tr>
                                ))}
                            </Thead>
                            <Tbody>
                                {rows.map(
                                    (row, i) => {
                                        prepareRow(row)
                                        return (
                                            <LinkBox as={Tr} _hover={{ bgColor: 'gray.100', cursor: 'pointer' }}>
                                                {row.cells.map(cell => (
                                                    <Td><LinkOverlay as={Link} to={`/nodes/${row.original.node}`}>{cell.render('Cell')}</LinkOverlay></Td>
                                                ))}
                                            </LinkBox>
                                        )
                                    }
                                )}
                            </Tbody>
                        </Table>
                    </TableContainer>
                }
            </VStack>
		</>
	)
}

export default Mining
