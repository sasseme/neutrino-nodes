import { TableContainer, Thead, Td, Th, Tbody, Tr, Table, LinkBox, LinkOverlay } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useTable } from 'react-table'

const formatter = Intl.NumberFormat([], { style: 'percent', maximumFractionDigits: 2 })

const DistributorsTable = ({ data }) => {
	const memoData = useMemo(() => {
		return data
	}, [data])

	const columns = useMemo(() => {
		return [
            { Header: 'Distributor', accessor: 'address' },
            { Header: 'Waves Earned', accessor: 'earned' },
            { Header: 'Distributions', accessor: 'count' },
            { Header: 'Percentage', accessor: 'percentage', Cell: ({ value }) => formatter.format(value) }
		]
	}, [])
	
	const {
		headerGroups,
		rows,
		prepareRow
	} = useTable({ columns, data: memoData })

	return (
		<>
            <TableContainer>
                <Table variant='simple'>
                    <Thead>
                        {headerGroups.map(headerGroup => (
                            <Tr>
                                {headerGroup.headers.map(column => (
                                    <Th {...column.getHeaderProps()}>
                                        {column.render('Header')}
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
                                            <Td><LinkOverlay isExternal href={`https://wavesexplorer.com/address/${row.original.address}`}>{cell.render('Cell')}</LinkOverlay></Td>
                                        ))}
                                    </LinkBox>
                                )
                            }
                        )}
                    </Tbody>
                </Table>
            </TableContainer>
		</>
	)
}

export default DistributorsTable
