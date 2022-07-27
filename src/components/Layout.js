import { HamburgerIcon } from "@chakra-ui/icons"
import { Box, HStack, Text, ButtonGroup, Button, useDisclosure, useBreakpointValue, Spacer, Stack, IconButton, Collapse } from "@chakra-ui/react"
import { NavLink, Outlet } from "react-router-dom"


const NavButton = ({ to, label, onClick, ...props }) => {
    return (
        <NavLink to={to} {...props}>
            {({ isActive }) => (
                <Button isActive={isActive} width='full' onClick={onClick}>{label}</Button>
            )}
        </NavLink>
    )
}

const Layout = () => {
    const { isOpen, onToggle } = useDisclosure()
    const smallMenu = useBreakpointValue({ base: true, md: false })
    const NavComponent = smallMenu ? Collapse : Box
    const ncProps = smallMenu ? { width: 'full', spacing: 0, gap: 2 } : { spacing: 3 }
    const buttonProps = smallMenu ? { onClick: onToggle } : {}
    return (
        <>
            <Stack direction={smallMenu ? 'column' : 'row' } py={3} px={5} spacing={smallMenu ? 2 : 10} as='nav' boxShadow='md'>
                <HStack>
                    <Text fontSize='lg' fontWeight='semibold'>Neutrino Nodes Stats</Text>
                    {smallMenu && <Spacer/>}
                    {smallMenu && <IconButton icon={<HamburgerIcon/>} onClick={onToggle}/>}
                </HStack>
                <NavComponent in={isOpen}>
                    <ButtonGroup flexDirection={smallMenu ? 'column' : 'row'} {...ncProps} variant='ghost'>
                        <NavButton label='Nodes' to='/nodes' {...buttonProps} end/>
                        <NavButton label='Mining' to='/mining' {...buttonProps}/>
                        <NavButton label='Distributions' to='/distributions' {...buttonProps}/>
                        <NavButton label='Applicants' to='/applicants' {...buttonProps}/>
                    </ButtonGroup>
                </NavComponent>
            </Stack>
            <Box>
                <Outlet/>
            </Box>
        </>
    )
}

export default Layout