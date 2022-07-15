import { useQuery } from 'react-query'
import { Box, Text, VStack, StackDivider, SimpleGrid, Stat, StatLabel, StatNumber, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react'
import _ from 'lodash'
import BigNumber from 'bignumber.js'
import axios from 'axios'
import { format, hoursToMilliseconds, minutesToMilliseconds } from 'date-fns'
import DistributorsTable from './components/DistributorsTable'
import DistributionsTable from './components/DistributionsTable'

const statFont = ['md', null, '2xl']

const Distributions = () => {
	const { error, data } = useQuery('distributions', async () => {
        const current = Date.now()
        const timeStart = current - hoursToMilliseconds(24)

        var hasMore = true
        var after = null
        const distributions = []
        while(hasMore) {
            const params = {
                dapp: '3P9vKqQKjUdmpXAfiWau8krREYAY1Xr69pE',
                function: 'distributeMinerReward',
                sort: 'desc',
                timeStart
            }
            if(after) params.after = after

            const qs = new URLSearchParams(params)
    
            const res = await axios.get(`https://api.wavesplatform.com/v0/transactions/invoke-script?${qs}`)
            distributions.push(...res.data.data.map(data => {
                const tx = data.data
                return {
                    txId: tx.id,
                    date: Date.parse(tx.timestamp),
                    amount: tx.payment[0].amount,
                    node: tx.sender,
                    distributor: tx.call.args[0].value
                }
            }))
            after = res.data.lastCursor
            hasMore = !res.data.isLastPage
        }

        const numDistributions = distributions.length
        const distributorCounts = _.mapValues(_.groupBy(distributions, 'distributor'), 'length')
        const distributors = _.orderBy(_.toPairs(distributorCounts).map(([address, count]) => {
            return {
                address,
                count,
                earned: new BigNumber(count).times(0.015).toNumber(),
                percentage: new BigNumber(count).div(numDistributions).decimalPlaces(4).toNumber()
            }
        }), [(d) => d.count], ['desc'])

        return {
            numDistributions,
            distributors,
            distributions,
            current: distributions[0].date
        }
	}, { refetchInterval: minutesToMilliseconds(10), staleTime: minutesToMilliseconds(30) })

	
	return (
		<>
            <VStack p={5} align='stretch' spacing={3} divider={<StackDivider/>}>
                <Box>
                    <Text fontSize='2xl' as='h1' fontWeight='semibold' mb={3}>Distribution Stats (Past 24 Hours)</Text>
                    {error && <Text>Could not load data</Text>}
                    {data && 
                        <>
                            <Text>As of {format(data.current, 'yyyy-MM-dd, HH:mm')}</Text>
                            <SimpleGrid columns={[1, null, 4]} spacing={[1, null, 5]} mt={2}>
                                <Stat>
                                    <StatLabel>Total Waves Distributed</StatLabel>
                                    <StatNumber fontSize={statFont}>{_.reduce(data.distributions, (total, current) => total.plus(current.amount), new BigNumber(0)).toNumber()}</StatNumber>
                                </Stat>
                                <Stat>
                                    <StatLabel># Distributions</StatLabel>
                                    <StatNumber fontSize={statFont}>{data.numDistributions}</StatNumber>
                                </Stat>
                            </SimpleGrid>
                        </>
                    }
                </Box>
                {data &&
                    <Tabs>
                        <TabList>
                            <Tab>Distributions</Tab>
                            <Tab>Distributors</Tab>
                        </TabList>
                        <TabPanels>
                            <TabPanel>
                                <DistributionsTable data={data.distributions}/>
                            </TabPanel>
                            <TabPanel>
                                <DistributorsTable data={data.distributors}/>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                }
            </VStack>
		</>
	)
}

export default Distributions
