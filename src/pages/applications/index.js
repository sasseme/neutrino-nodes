import { create } from '@waves/node-api-js'
import { useQuery } from 'react-query'
import { differenceInMilliseconds, compareAsc, format, intervalToDuration, minutesToMilliseconds } from 'date-fns'
import { Link, Icon, TableContainer, Thead, Td, Th, Tbody, Tr, Table, Box, Text, SimpleGrid, Stat, StatLabel, StatNumber, VStack, StackDivider, LinkBox, LinkOverlay } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useTable, useSortBy } from 'react-table'
import { InfoIcon, TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons'


const AVAILABLE_SPOTS = 80

const statFont = ['md', null, '2xl']

const api = create('https://nodes.wavesnodes.com')

const dateSort = (a, b, id, desc) => {
	const dateA = a.original[id]
	const dateB = b.original[id]
	if(dateA && dateB) {
		return compareAsc(dateA, dateB)
	} else if(dateA) {
		return 1
	} else if(dateB) {
		return -1
	} else {
		return 0
	}
}

const Applications = () => {
	const { error, data } = useQuery('applicants', async () => {
		const data = await api.addresses.data('3P9vKqQKjUdmpXAfiWau8krREYAY1Xr69pE', { matches: encodeURIComponent('^%s__3P\\w+$') })
		const applications = data.map(d => {
			const address = d.key.split('__')[1]
			const config = d.value.split('__')
			const info = {
				address,
				applicationDate: new Date(parseInt(config[3])),
				status: 'Pending',
                isApproved: false
			}
			if(config.length > 6) {
				if(config[6] === 'APPROVED') {
					info.status = 'Approved'
                    info.isApproved = true
					info.approvalDate = new Date(parseInt(config[8]))
					info.waitTime = intervalToDuration({
						start: info.applicationDate,
						end: info.approvalDate
					})
					info.waitTimeDiff = differenceInMilliseconds(info.approvalDate, info.applicationDate)
				}
			}
			return info
		})
        applications.sort((a, b) => compareAsc(a.applicationDate, b.applicationDate))
        return {
            applications,
            current: Date.now()
        }
	}, { staleTime: minutesToMilliseconds(30), refetchInterval: minutesToMilliseconds(10) })

	const memoData = useMemo(() => {
		return data?.applications || []
	}, [data])

    const numApproved = useMemo(() => {
        return data?.applications?.filter(d => d.isApproved)?.length
    }, [data])

	const columns = useMemo(() => {
		return [
			{ Header: 'Address', accessor: 'address', disableSortBy: true },
			{ Header: 'Application Date', sortType: dateSort, accessor: 'applicationDate', Cell: ({ value }) => format(value, 'yyyy-MM-dd, HH:mm') },
			{ Header: 'Status', accessor: 'status' },
			{ Header: 'Approval Date', sortType: dateSort , accessor: 'approvalDate', Cell: ({ value }) => value ? format(value, 'yyyy-MM-dd, HH:mm') : 'N/A' },
		]
	}, [])
	
	const {
		headerGroups,
		rows,
		prepareRow
	} = useTable({ columns, data: memoData, autoResetSortBy: false, initialState: { sortBy: [{ id: 'applicationDate', desc: false }]} }, useSortBy)

	return (
		<>
            <VStack p={5} align='stretch' spacing={3} divider={<StackDivider/>}>
                <Box>
                    <Text fontSize='2xl' as='h1' fontWeight='semibold' mb={3}>Applicants</Text>
                    {error && <Text>Could not load data</Text>}
                    {data && 
                        <>
                            <Text>As of {format(data.current, 'yyyy-MM-dd, HH:mm')}</Text>
                            <Text mt={2} fontSize='sm' color='gray.700'><Icon as={InfoIcon} color='blue.500'/> All spots have been filled. Unselected nodes can get their deposit back using the <Link href='https://waves-dapp.com/3P9vKqQKjUdmpXAfiWau8krREYAY1Xr69pE#returnDeposit' textDecoration='underline'>returnDeposit function</Link></Text>
                        </>
                    }
                    {memoData.length > 0 &&
                        <SimpleGrid columns={[1, null, 4]} spacing={[1, null, 5]} mt={2}>
                            <Stat>
                                <StatLabel>Total Applicants</StatLabel>
                                <StatNumber fontSize={statFont}>{memoData.length}</StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>Approved Nodes</StatLabel>
                                <StatNumber fontSize={statFont}>{numApproved}/{AVAILABLE_SPOTS}</StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>Remaining Spots</StatLabel>
                                <StatNumber fontSize={statFont}>{AVAILABLE_SPOTS - numApproved}</StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>Acceptance Chance</StatLabel>
                                <StatNumber fontSize={statFont}>{Math.round((AVAILABLE_SPOTS - numApproved) / (memoData.length - numApproved) * 100)}%</StatNumber>
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
                                            <LinkBox as={Tr} _hover={row.original.isApproved ? { bgColor: 'gray.100', cursor: 'pointer' } : null}>
                                                <Td>
                                                    {row.original.isApproved ?
                                                        <LinkOverlay as={Link} to={`/nodes/${row.original.address}`}>{parseInt(row.id) + 1}</LinkOverlay>:
                                                        <span>{parseInt(row.id) + 1}</span>
                                                    }
                                                </Td>
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

export default Applications
