import { QueryClient, QueryClientProvider } from 'react-query'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Applications from './pages/applications'
import Address from './pages/address'
import Nodes from './pages/nodes'
import Distributions from './pages/distributors'
import Layout from './components/Layout'

const queryClient = new QueryClient()

const theme = extendTheme({
	textStyles: {
		'dynamic-stat': {
			fontSize: ['md', null, '2xl']
		}
	}
})


const App = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<ChakraProvider theme={theme}>
				<BrowserRouter>
					<Routes>
						<Route path='/' element={<Layout/>}>
							<Route index element={<Navigate to='/nodes' replace/>}/>
							<Route path='/nodes' element={<Nodes/>}/>
							<Route path='/distributions' element={<Distributions/>}/>
							<Route path='/applicants' element={<Applications/>}/>
							<Route path='/nodes/:address' element={<Address/>}/>
						</Route>
						
					</Routes>
				</BrowserRouter>
			</ChakraProvider>
		</QueryClientProvider>
	)
}

export default App
