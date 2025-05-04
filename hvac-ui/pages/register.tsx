import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Flex,
  Container,
  Image,
  FormErrorMessage,
  HStack,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { register } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      await register({
        name,
        email,
        password,
        confirmPassword,
      });
      
      toast({
        title: 'Account created successfully',
        description: 'You have been automatically logged in',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.response?.data?.message || error.message || 'An error occurred during registration',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="md" pt={10} pb={10}>
        <Flex direction="column" align="center" mb={6}>
          <Image src="/logo.png" alt="HVAC CRM Logo" boxSize="80px" mb={3} />
          <Heading as="h1" size="xl" textAlign="center" mb={2}>
            Create an Account
          </Heading>
          <Text color="gray.600" textAlign="center">
            Join HVAC CRM to manage your business
          </Text>
        </Flex>

        <Box bg="white" p={8} rounded="lg" shadow="base">
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="name" isRequired isInvalid={!!errors.name}>
                <FormLabel>Full Name</FormLabel>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl id="email" isRequired isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl id="password" isRequired isInvalid={!!errors.password}>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <FormControl id="confirmPassword" isRequired isInvalid={!!errors.confirmPassword}>
                <FormLabel>Confirm Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                      variant="ghost"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                mt={6}
                isLoading={isLoading}
              >
                Create Account
              </Button>
              
              <HStack pt={4}>
                <Text>Already have an account?</Text>
                <Link href="/login" passHref>
                  <Text as="a" color="blue.500" fontWeight="semibold">
                    Sign In
                  </Text>
                </Link>
              </HStack>
            </VStack>
          </form>
        </Box>
      </Container>
    </Box>
  );
}
