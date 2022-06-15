import { QueryClient, QueryClientProvider } from 'react-query'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/main'
import Address from './pages/address'

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
						<Route path='/' element={<Dashboard/>}/>
						<Route path='/:address' element={<Address/>}/>
					</Routes>
				</BrowserRouter>
			</ChakraProvider>
		</QueryClientProvider>
	)
}

export default App
