import { useState } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Container,
  Heading,
} from '@chakra-ui/react';
import Layout from '../components/Layout';
import EmailList from '../components/emails/EmailList';
import OfferList from '../components/offers/OfferList';
import { useAuth } from '../hooks/useAuth';

const CommunicationsPage = () => {
  const { isAuthenticated } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Layout>
      <Container maxW="container.xl" py={5}>
        <Heading mb={6}>Communications</Heading>
        
        <Tabs index={tabIndex} onChange={setTabIndex} variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Emails</Tab>
            <Tab>Offers</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <EmailList />
            </TabPanel>
            <TabPanel>
              <OfferList />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Layout>
  );
};

export default CommunicationsPage;