import { create } from '@waves/node-api-js'
import { useQuery } from 'react-query'
import { differenceInMilliseconds, compareAsc, format, formatDuration, intervalToDuration } from 'date-fns'
import { Icon, TableContainer, Thead, Td, Th, Tbody, Tr, Table, Box, Text, SimpleGrid, Stat, StatLabel, StatNumber, VStack, StackDivider, LinkBox, LinkOverlay } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useTable, useSortBy } from 'react-table'
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons'
import { Link, useNavigate } from 'react-router-dom'

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

const intervalSort = (a, b, id, desc) => {
	const intervalA = a.original.waitTimeDiff
	const intervalB = b.original.waitTimeDiff
	if(intervalA && intervalB) {
		return intervalA > intervalB ? 1 : (intervalB > intervalA ? -1 : 0)
	} else if(intervalA) {
		return 1
	} else if(intervalB) {
		return -1
	} else {
		return 0
	}
}

const Dashboard = () => {
    const navigate = useNavigate()
	const { isLoading, error, data=[] } = useQuery('applicants', async () => {
		const data = await api.addresses.data('3P9vKqQKjUdmpXAfiWau8krREYAY1Xr69pE', { matches: encodeURIComponent('^%s__\\w+$') })
		const applications = data.map(d => {
			const address = d.key.split('__')[1]
			const config = d.value.split('__')
			const info = {
				address,
				applicationDate: new Date(parseInt(config[3])),
				status: 'Pending'
			}
			if(config.length > 6) {
				if(config[6] === 'APPROVED') {
					info.status = 'Approved'
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
        return applications
	})

	const memoData = useMemo(() => {
		return data
	}, [data])

    const numApproved = useMemo(() => {
        return data?.filter(d => d.status === 'Approved')?.length
    }, [data])

	const columns = useMemo(() => {
		return [
			{ Header: 'Address', accessor: 'address', disableSortBy: true },
			{ Header: 'Application Date', sortType: dateSort, accessor: 'applicationDate', Cell: ({ value }) => format(value, 'yyyy-MM-dd, HH:mm') },
			{ Header: 'Status', accessor: 'status' },
			{ Header: 'Approval Date', sortType: dateSort , accessor: 'approvalDate', Cell: ({ value }) => value ? format(value, 'yyyy-MM-dd, HH:mm') : 'N/A' },
			{ Header: 'Wait Time', sortType: intervalSort, accessor: 'waitTime', Cell: ({ value }) => value ? formatDuration(value, { format: ['days', 'hours'] }) : 'N/A' }
		]
	}, [])
	
	const {
		getTableProps,
		getTableBodyProps,
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
                    {data.length > 0 &&
                        <SimpleGrid columns={[1, null, 4]} spacing={[1, null, 5]}>
                            <Stat>
                                <StatLabel>Total Applicants</StatLabel>
                                <StatNumber fontSize={statFont}>{data.length}</StatNumber>
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
                                <StatNumber fontSize={statFont}>{Math.round((AVAILABLE_SPOTS - numApproved) / (data.length - numApproved) * 100)}%</StatNumber>
                            </Stat>
                        </SimpleGrid>
                    }
                </Box>
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
                                            <Td><LinkOverlay as={Link} to={`/${row.original.address}`}>{parseInt(row.id) + 1}</LinkOverlay></Td>
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
            </VStack>
		</>
	)
}

export default Dashboard
