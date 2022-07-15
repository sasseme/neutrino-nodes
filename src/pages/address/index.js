import { create } from '@waves/node-api-js'
import { useQuery } from 'react-query'
import { format, minutesToMilliseconds } from 'date-fns'
import { Box, Text, VStack, SimpleGrid, Stat, StatNumber, StatLabel, StackDivider, Link, Icon, HStack, StatHelpText } from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import BigNumber from 'bignumber.js'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import axios from 'axios'

const api = create('https://nodes.wavesnodes.com')

const toDisplay = (num) => {
    return new BigNumber(num).div(Math.pow(10, 8)).toNumber()
}

const statFont = ['md', null, '2xl']

const Address = () => {
    const { address } = useParams()
	const { error, data } = useQuery(['addressDetails', address], async () => {
        const [totals, application, balance, beneficiaryAddress] = await Promise.all([
            api.addresses.fetchDataKey('3P9vKqQKjUdmpXAfiWau8krREYAY1Xr69pE', `%s%s__totals__${address}`).catch(e => e),
            api.addresses.fetchDataKey('3P9vKqQKjUdmpXAfiWau8krREYAY1Xr69pE', `%s__${address}`).catch(e => e),
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

        if(balance.error) {
            stats.leasedBalance = 0
            stats.availableBalance = 0
        } else {
            stats.leasedBalance = balance.effective - balance.available
            stats.availableBalance = balance.available
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
                    totalAmount: tx.payment[0].amount
                }
            })
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
                    <Text fontSize='lg' fontWeight='semibold' mb={3} as='h2'>Recent Distributions</Text>
                    <VStack align='stretch' spacing={4}>
                        {data && data.distributions.map(d => (
                            <Box>
                                <Text fontSize='sm' color='gray.500'>{format(d.date, 'yyyy-MM-dd HH:mm')}</Text>
                                <HStack>
                                    <Link isExternal href={`https://wavesexplorer.com/tx/${d.txId}`}>{d.totalAmount} WAVES <Icon as={ExternalLinkIcon}/></Link> 
                                </HStack>
                            </Box>
                        ))}

                    </VStack>
                </Box>
            }
		</VStack>
	)
}

export default Address
