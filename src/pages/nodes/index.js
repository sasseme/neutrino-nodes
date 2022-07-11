import { create } from '@waves/node-api-js'
import { useQuery } from 'react-query'
import { Icon, TableContainer, Thead, Td, Th, Tbody, Tr, Table, Box, Text, VStack, StackDivider, LinkBox, LinkOverlay } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useTable, useSortBy } from 'react-table'
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons'
import { Link } from 'react-router-dom'
import _ from 'lodash'
import BigNumber from 'bignumber.js'
import { minutesToMilliseconds } from 'date-fns'

const toDisplay = (num) => {
    return new BigNumber(num).div(Math.pow(10, 8)).toNumber()
}

const api = create('https://nodes.wavesnodes.com')

const Nodes = () => {
	const { error, data=[] } = useQuery('nodes', async () => {

        const [amountsData, totalsData, groups] = await Promise.all([
            api.addresses.data('3PC9BfRwJWWiw9AREE2B3eWzCks3CYtg4yo', { matches: encodeURIComponent(`^%s%s%s__leaseByAddress__\\w+__amount$`) }),
		    api.addresses.data('3P9vKqQKjUdmpXAfiWau8krREYAY1Xr69pE', { matches: encodeURIComponent('^%s%s__totals__\\w+$') }),
            api.addresses.data('3PC9BfRwJWWiw9AREE2B3eWzCks3CYtg4yo', { matches: encodeURIComponent(`^%s%d%s__leaseGroup__\\d+__nodeList$`) })
        ])

        const groupIds = _.fromPairs(groups.map(({ key, value }) => {
            const groupId = parseInt(key.split('__')[2])
            return value.split('__').map(address => [address, groupId])
        }).flat())

        const totals = _.fromPairs(totalsData.map(({ key, value }) => {
            const address = key.split('__')[2]
            const data = value.split('__')
            return [
                address,
                {
                    totalMined: parseInt(data[1]),
                    commission: parseInt(data[2]),
                    protocol: parseInt(data[3])
                }
            ]
        }))

        const amounts = _.fromPairs(amountsData.map(({ key, value }) => {
            const address = key.split('__')[2]
            return [address, value]
        }))

        const addresses = _.keys(groupIds)

        const nodes = addresses.map(address => {
            return {
                address,
                groupId: groupIds[address],
                leaseAmount: amounts[address],
                ...totals[address]
            }
        })

        return nodes
	}, { staleTime: minutesToMilliseconds(30) })

	const memoData = useMemo(() => {
		return data
	}, [data])

	const columns = useMemo(() => {
		return [
            { Header: 'Group Id', accessor: 'groupId' },
			{ Header: 'Address', accessor: 'address', disableSortBy: true },
            { Header: 'Lease Amount', accessor: 'leaseAmount', Cell: ({ value }) => toDisplay(value) },
            { Header: 'Total Mined', accessor: 'totalMined', Cell: ({ value }) => toDisplay(value) },
            { Header: 'Owner Commission', accessor: 'commission', Cell: ({ value }) => toDisplay(value) },
		]
	}, [])
	
	const {
		headerGroups,
		rows,
		prepareRow
	} = useTable({ columns, data: memoData, autoResetSortBy: false }, useSortBy)

	return (
		<>
            <VStack p={5} align='stretch' spacing={3} divider={<StackDivider/>}>
                <Box>
                    <Text fontSize='2xl' as='h1' fontWeight='semibold' mb={3}>Nodes</Text>
                    {error && <Text>Could not load data</Text>}
                    {(!error && data.length === 0) && <Text>Loading...</Text>}
                </Box>
                {data.length > 0 &&
                    <TableContainer>
                        <Table variant='simple'>
                            <Thead>
                                {headerGroups.map(headerGroup => (
                                    <Tr>
                                        <Th>#</Th>
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
                                                <Td><LinkOverlay as={Link} to={`/nodes/${row.original.address}`}>{parseInt(row.id) + 1}</LinkOverlay></Td>
                                                {row.cells.map(cell => (
                                                    <Td>{cell.render('Cell')}</Td>
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

export default Nodes
