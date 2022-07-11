import { TableContainer, Thead, Td, Th, Tbody, Tr, Table, LinkBox, LinkOverlay } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useTable } from 'react-table'
import { format } from 'date-fns'


const DistributionsTable = ({ data }) => {
	const memoData = useMemo(() => {
		return data
	}, [data])

	const columns = useMemo(() => {
		return [
            { Header: 'Date', accessor: 'date', Cell: ({ value }) => format(value, 'yyyy-MM-dd, HH:mm') },
            { Header: 'Amount', accessor: 'amount' },
            { Header: 'Node', accessor: 'node' },
            { Header: 'Distributor', accessor: 'distributor' }
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
                                            <Td><LinkOverlay href={`https://wavesexplorer.com/tx/${row.original.txId}`} isExternal>{cell.render('Cell')}</LinkOverlay></Td>
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

export default DistributionsTable
