import { create } from '@waves/node-api-js'
import { useQuery } from 'react-query'
import { format, compareDesc } from 'date-fns'
import { Box, Text, VStack, SimpleGrid, Stat, StatNumber, StatLabel, Tag, StackDivider, Link, Icon, HStack, StatHelpText } from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import BigNumber from 'bignumber.js'
import { ExternalLinkIcon } from '@chakra-ui/icons'

const api = create('https://nodes.wavesnodes.com')

const toDisplay = (num) => {
    return new BigNumber(num).div(Math.pow(10, 8)).toNumber()
}

const isLatePayment = (current, last) => {
    return current - last > 1440
}

const statFont = ['md', null, '2xl']

const Address = () => {
    const { address } = useParams()
	const { isLoading, error, data } = useQuery(['addressDetails', address], async () => {
        const [totals, application, balance, heightData] = await Promise.all([
            api.addresses.fetchDataKey('3P9vKqQKjUdmpXAfiWau8krREYAY1Xr69pE', `%s%s__totals__${address}`).catch(e => e),
            api.addresses.fetchDataKey('3P9vKqQKjUdmpXAfiWau8krREYAY1Xr69pE', `%s__${address}`).catch(e => e),
            api.addresses.fetchBalanceDetails(address).catch(e => e),
            api.blocks.fetchHeight()
        ])
        const currentHeight = heightData.height
        const stats = {
            status: 'Pending'
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

		const data = await api.addresses.data('3P9vKqQKjUdmpXAfiWau8krREYAY1Xr69pE', { matches: encodeURIComponent(`^%s%s%s__history__${address}__\\w+$`) })
		const distributions = data.map((d, i, arr) => {
			const config = d.value.split('__')
			const info = {
                txId: d.key.split('__')[3],
                block: parseInt(config[1]),
                date: new Date(parseInt(config[2])),
                totalAmount: parseInt(config[3]),
                rewardAmount: parseInt(config[4]),
                protocolAmount: parseInt(config[5]),
                type: 'distribution'
			}
			return info
		})

        distributions.sort((a, b) => compareDesc(a.date, b.date))
        stats.lastPaymentBlock = distributions[0]?.block
        stats.lastPaymentDate = distributions[0]?.date
        stats.latePayments = stats.isApproved && stats.lastPaymentBlock ? (stats.lastPaymentBlock > stats.approvalDate && isLatePayment(currentHeight, stats.lastPaymentBlock) ? 1 : 0) : 0
        const dists = distributions.map((d, i, arr) => {
            var isLate = false
            if(i !== arr.length - 1) {
                if(arr[i + 1].block > stats.approvalBlock) {
                    isLate = isLatePayment(d.block, arr[i + 1].block)
                }
            }
            if(isLate) stats.latePayments += 1
            return {
                ...d,
                isLate
            }
        })
        return {
            stats,
            distributions: dists
        }
	})

	return (
		<VStack p={5} align='stretch' spacing={3} divider={<StackDivider/>}>
            <Box>
                <Text fontSize='2xl' as='h1' fontWeight='semibold'>Node Details</Text>
                <Link href={`https://wavesexplorer.com/address/${address}`} isExternal>{address} <Icon as={ExternalLinkIcon}/></Link>
            </Box>
            {error && <Text>Could not load data</Text>}
            {data &&
                <>
                    <SimpleGrid columns={[1, null, 4]} spacing={[1, null, 5]}>
                        <Stat>
                            <StatLabel>Status</StatLabel>
                            <StatNumber fontSize={statFont}>{data.stats.status}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Lease Amount</StatLabel>
                            <StatNumber fontSize={statFont}>{toDisplay(data.stats.leasedBalance)}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Waves Distributed</StatLabel>
                            <StatNumber fontSize={statFont}>{toDisplay(data.stats.amountMined)}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Outstanding Balance</StatLabel>
                            <StatNumber fontSize={statFont}>{toDisplay(data.stats.availableBalance)}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Amount Sent to Protocol</StatLabel>
                            <StatNumber fontSize={statFont}>{toDisplay(data.stats.protocolEarnings)}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Node Commission</StatLabel>
                            <StatNumber fontSize={statFont}>{toDisplay(data.stats.commission)}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Last Distribution Date</StatLabel>
                            <StatNumber fontSize={statFont}>{data.stats.lastPaymentDate ? format(data.stats.lastPaymentDate, 'yyyy-MM-dd') : 'N/A'}</StatNumber>
                            {data.stats.lastPaymentBlock && <StatHelpText>Block {data.stats.lastPaymentBlock}</StatHelpText>}
                        </Stat>
                        <Stat>
                            <StatLabel>Late Payments</StatLabel>
                            <StatNumber fontSize={statFont}>{data.stats.latePayments}</StatNumber>
                            <StatHelpText>More than 1440 blocks from prior distribution</StatHelpText>
                        </Stat>
                    </SimpleGrid>
                    <Text></Text>
                </>
            }
            {data && 
                <Box>
                    <Text fontSize='lg' fontWeight='semibold' mb={3} as='h2'>Distribution History</Text>
                    <VStack align='stretch' spacing={4}>
                        {data && data.distributions.map(d => (
                            <Box>
                                <Text fontSize='sm' color='gray.500'>{format(d.date, 'yyyy-MM-dd HH:mm')}</Text>
                                <HStack>
                                    <Link isExternal href={`https://wavesexplorer.com/tx/${d.txId}`}>{toDisplay(d.totalAmount)} WAVES <Icon as={ExternalLinkIcon}/></Link> 
                                    {d.isLate && <Tag colorScheme='red' size='sm'>Late</Tag>}

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
