import { Box, Heading, Text, SimpleGrid, Card, CardBody, Divider, Grid, GridItem, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import ContainerTest from '@/components/ContainerTest';
import UIContainerTest from '@/components/UIContainerTest';
import ContainerEnvironmentTest from '@/components/ContainerEnvironmentTest';
import ContainerNetworkTest from '@/components/ContainerNetworkTest';
import ContainerPerformanceTest from '@/components/ContainerPerformanceTest';

export default function ContainerTestPage() {
  return (
    <ResponsiveLayout title="Container Test">
      <Box p={4}>
        <Heading mb={6}>Container Component Test</Heading>
        
        <Text mb={4}>
          This page tests the container components in the application.
        </Text>
        
        {/* Container Tests */}
        <Tabs variant="enclosed" colorScheme="blue" mb={8}>
          <TabList>
            <Tab>Basic Tests</Tab>
            <Tab>Environment Tests</Tab>
            <Tab>Network Tests</Tab>
            <Tab>Performance Tests</Tab>
            <Tab>Layout Tests</Tab>
          </TabList>
          
          <TabPanels>
            {/* Basic Tests */}
            <TabPanel p={4}>
              <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={8}>
                <GridItem>
                  <Heading size="md" mb={4}>API Container Test</Heading>
                  <ContainerTest />
                </GridItem>
                
                <GridItem>
                  <Heading size="md" mb={4}>UI Container Browser Test</Heading>
                  <UIContainerTest />
                </GridItem>
              </Grid>
            </TabPanel>
            
            {/* Environment Tests */}
            <TabPanel p={4}>
              <ContainerEnvironmentTest />
            </TabPanel>
            
            {/* Network Tests */}
            <TabPanel p={4}>
              <ContainerNetworkTest />
            </TabPanel>
            
            {/* Performance Tests */}
            <TabPanel p={4}>
              <ContainerPerformanceTest />
            </TabPanel>
            
            {/* Layout Tests */}
            <TabPanel p={4}>
              <Heading size="md" mb={4}>UI Container Layout Test</Heading>
              <Text mb={4}>
                The cards below test the UI container layout responsiveness.
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <Card key={item}>
                    <CardBody>
                      <Heading size="md" mb={2}>Test Card {item}</Heading>
                      <Text>
                        This is a test card to verify that the container layout is working properly.
                      </Text>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </ResponsiveLayout>
  );
}