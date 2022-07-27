import { create } from '@waves/node-api-js'
import { useQuery } from 'react-query'
import { format, minutesToMilliseconds } from 'date-fns'
import { Box, Text, VStack, SimpleGrid, Stat, StatNumber, StatLabel, StackDivider, Link, Icon, TableContainer, Table, Thead, Tr, Th, Tbody, Td, LinkBox, LinkOverlay } from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import BigNumber from 'bignumber.js'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import axios from 'axios'
import _ from 'lodash'

const api = create('https://nodes.wavesnodes.com')

const toDisplay = (num) => {
    return new BigNumber(num).div(Math.pow(10, 8)).toNumber()
}

const statFont = ['md', null, '2xl']

const Address = () => {
    const { address } = useParams()
	const { error, data } = useQuery(['addressDetails', address], async () => {
        const [totals, application, leasedAmount, balance, beneficiaryAddress] = await Promise.all([
            api.addresses.fetchDataKey('3P9vKqQKjUdmpXAfiWau8krREYAY1Xr69pE', `%s%s__totals__${address}`).catch(e => e),
            api.addresses.fetchDataKey('3P9vKqQKjUdmpXAfiWau8krREYAY1Xr69pE', `%s__${address}`).catch(e => e),
            api.addresses.fetchDataKey('3PC9BfRwJWWiw9AREE2B3eWzCks3CYtg4yo', `%s%s%s__leaseByAddress__${address}__amount`).catch(e => e),
            api.addresses.fetchBalanceDetails(address).catch(e => e),
            api.addresses.fetchDataKey(address, '%s%s__cfg__beneficiaryAddress').then(d => d.value).catch(e => null)
        ])

        const stats = {
            status: 'Pending',
            beneficiaryAddress
        }

        if(application.error) {
            throw Error('Could not fetch data')
        } else {
            const config = application.value.split('__')
            stats.applicationDate = new Date(parseInt(config[3]))
			if(config.length > 6) {
				if(config[6] === 'APPROVED') {
					stats.isApproved = true
                    stats.status = 'Approved'
					stats.approvalDate = new Date(parseInt(config[8]))
                    stats.approvalBlock = parseInt(config[7])
				}
			}
        }

        if(leasedAmount.error) {
            if(balance.error) {
                stats.leasedBalance = 0
                stats.availableBalance = 0
            } else {
                stats.leasedBalance = balance.effective - balance.available
                stats.availableBalance = balance.available
            }
        } else {
            stats.leasedBalance = leasedAmount.value
            if(balance.error) {
                stats.availableBalance = 0
            } else {
                stats.availableBalance = balance.available
            }
        }

        if(totals.error) {
            stats.amountMined = 0
            stats.commission = 0
            stats.protocolEarnings = 0
        } else {
            const spl = totals.value.split('__')
            stats.amountMined = parseInt(spl[1])
            stats.commission = parseInt(spl[2])
            stats.protocolEarnings = parseInt(spl[3])
        }

        const qs = new URLSearchParams({
            sender: address,
            dapp: '3P9vKqQKjUdmpXAfiWau8krREYAY1Xr69pE',
            function: 'distributeMinerReward',
            sort: 'desc',
            limit: 20
        })

        const distributions = await axios.get(`https://api.wavesplatform.com/v0/transactions/invoke-script?${qs}`).then(res => {
            return res.data.data.map(data => {
                const tx = data.data
                return {
                    txId: tx.id,
                    block: tx.height,
                    date: Date.parse(tx.timestamp),
                    totalAmount: tx.payment[0].amount,
                    distributor: tx.call.args[0].value
                }
            })
        })

        const txIdKeys = distributions.map(d => `%s%s%s__history__${address}__${d.txId}`)
        const realTimes = await axios.post('https://nodes.wavesnodes.com/addresses/data/3P9vKqQKjUdmpXAfiWau8krREYAY1Xr69pE', {
            keys: txIdKeys
        }).then(res => {
            return _.mapValues(_.keyBy(res.data, (data) => data.key.split('__')[3]), (data) => parseInt(data.value.split('__')[2]))
        })
        
        distributions.forEach(dist => {
            dist.date = realTimes[dist.txId]
        })
        
        return {
            stats,
            distributions
        }
	}, { staleTime: minutesToMilliseconds(30) })

	return (
		<VStack p={5} align='stretch' spacing={3} divider={<StackDivider/>}>
            <Box>
                <Text fontSize='2xl' as='h1' fontWeight='semibold'>Node Details</Text>
                <Link href={`https://wavesexplorer.com/address/${address}`} isExternal>{address} <Icon as={ExternalLinkIcon}/></Link>
                {data?.stats?.beneficiaryAddress && <Text mt={2} fontSize='sm'>Current Beneficiary Address: <Link href={`https://wavesexplorer.com/address/${data.stats.beneficiaryAddress}`} isExternal>{data.stats.beneficiaryAddress} <Icon as={ExternalLinkIcon}/></Link></Text>}
            </Box>
            {error && <Text>Could not load data</Text>}
            {data &&
                <>
                    <SimpleGrid columns={[1, null, 3]} spacing={[1, null, 5]}>
                        <Stat>
                            <StatLabel>Lease Amount</StatLabel>
                            <StatNumber fontSize={statFont}>{toDisplay(data.stats.leasedBalance)}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Total Distributed</StatLabel>
                            <StatNumber fontSize={statFont}>{toDisplay(data.stats.amountMined)}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Pending Distribution</StatLabel>
                            <StatNumber fontSize={statFont}>{toDisplay(data.stats.availableBalance)}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Distributed to Protocol</StatLabel>
                            <StatNumber fontSize={statFont}>{toDisplay(data.stats.protocolEarnings)}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Distributed to Node Owner</StatLabel>
                            <StatNumber fontSize={statFont}>{toDisplay(data.stats.commission)}</StatNumber>
                        </Stat>
                    </SimpleGrid>
                </>
            }
            {data && 
                <Box>
                    <Text fontSize='lg' fontWeight='semibold' mb={3} as='h2'>Last 20 Distributions</Text>
                    <TableContainer>
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th>Date</Th>
                                    <Th>Amount</Th>
                                    <Th>Distributor</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data.distributions.map(d => (
                                    <LinkBox as={Tr} _hover={{ bgColor: 'gray.100', cursor: 'pointer' }}>
                                        <Td><LinkOverlay href={`https://wavesexplorer.com/tx/${d.txId}`} isExternal>{format(d.date, 'yyyy-MM-dd HH:mm')}</LinkOverlay></Td>
                                        <Td>{d.totalAmount}</Td>
                                        <Td>{d.distributor}</Td>
                                    </LinkBox>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </Box>
            }
		</VStack>
	)
}

export default Address
