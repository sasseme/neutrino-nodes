import { Box, Container, Flex, Text } from "@chakra-ui/react"
import { NavLink, Outlet } from "react-router-dom"

const Layout = () => {
    return (
        <>
            <Box as="nav">
                <Container py={4}>
                    <Flex direction='row' width='full' spacing="8" justifyContent='space-between'>
                        <NavLink to='/nodes'><Text textDecoration='underline'>Nodes</Text></NavLink>
                        <NavLink to='/mining'><Text textDecoration='underline'>Mining</Text></NavLink>
                        <NavLink to='/distributions'><Text textDecoration='underline'>Distributions</Text></NavLink>
                        <NavLink to='/applicants'><Text textDecoration='underline'>Applicants</Text></NavLink>
                    </Flex>
                </Container>
                <Outlet/>
            </Box>
        </>
    )
}

export default Layout