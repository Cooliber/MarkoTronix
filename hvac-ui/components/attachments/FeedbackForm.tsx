import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Flex,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Checkbox,
  Select,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import mailIngestApi, { ProcessedAttachment, Attachment } from '../../api/mail-ingest';

interface FeedbackFormProps {
  attachment: Attachment;
  onSubmitFeedback?: (feedbackData: any) => void;
}

interface FeedbackData {
  attachmentId: number;
  processedAttachmentId: number;
  correctedEntities: Record<string, any>;
  correctedTags: string[];
  missingEntities: Record<string, any>;
  missingTags: string[];
  feedbackNotes: string;
  rating: number;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ attachment, onSubmitFeedback }) => {
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    attachmentId: 0,
    processedAttachmentId: 0,
    correctedEntities: {},
    correctedTags: [],
    missingEntities: {},
    missingTags: [],
    feedbackNotes: '',
    rating: 3,
  });
  const [entityCorrections, setEntityCorrections] = useState<Record<string, string>>({});
  const [newEntityKey, setNewEntityKey] = useState('');
  const [newEntityValue, setNewEntityValue] = useState('');
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (attachment && attachment.processed_data) {
      initializeFeedbackData(attachment);
    }
  }, [attachment]);

  // Initialize feedback data from attachment
  const initializeFeedbackData = (attachment: Attachment) => {
    if (!attachment.processed_data) return;

    const processedData = attachment.processed_data;
    
    // Initialize entity corrections with current values
    const initialEntityCorrections: Record<string, string> = {};
    if (processedData.entities) {
      Object.entries(processedData.entities).forEach(([key, value]) => {
        initialEntityCorrections[key] = Array.isArray(value) 
          ? JSON.stringify(value) 
          : typeof value === 'object' 
            ? JSON.stringify(value) 
            : String(value);
      });
    }
    
    setEntityCorrections(initialEntityCorrections);
    
    // Initialize feedback data
    setFeedbackData({
      attachmentId: attachment.id,
      processedAttachmentId: processedData.id,
      correctedEntities: {},
      correctedTags: processedData.tags || [],
      missingEntities: {},
      missingTags: [],
      feedbackNotes: '',
      rating: 3,
    });
  };

  // Handle entity correction changes
  const handleEntityCorrectionChange = (key: string, value: string) => {
    setEntityCorrections({
      ...entityCorrections,
      [key]: value,
    });
    
    // Add to corrected entities if different from original
    const originalValue = attachment.processed_data?.entities?.[key];
    const originalValueStr = Array.isArray(originalValue) 
      ? JSON.stringify(originalValue) 
      : typeof originalValue === 'object' 
        ? JSON.stringify(originalValue) 
        : String(originalValue);
    
    if (value !== originalValueStr) {
      setFeedbackData(prev => ({
        ...prev,
        correctedEntities: {
          ...prev.correctedEntities,
          [key]: value,
        },
      }));
    } else {
      // Remove from corrected entities if same as original
      const { [key]: _, ...rest } = feedbackData.correctedEntities;
      setFeedbackData(prev => ({
        ...prev,
        correctedEntities: rest,
      }));
    }
  };

  // Add new entity
  const addNewEntity = () => {
    if (!newEntityKey || !newEntityValue) return;
    
    setEntityCorrections({
      ...entityCorrections,
      [newEntityKey]: newEntityValue,
    });
    
    setFeedbackData(prev => ({
      ...prev,
      missingEntities: {
        ...prev.missingEntities,
        [newEntityKey]: newEntityValue,
      },
    }));
    
    setNewEntityKey('');
    setNewEntityValue('');
  };

  // Handle tag changes
  const handleTagChange = (tag: string, isChecked: boolean) => {
    if (isChecked) {
      // Add tag if not already in the list
      if (!feedbackData.correctedTags.includes(tag)) {
        setFeedbackData(prev => ({
          ...prev,
          correctedTags: [...prev.correctedTags, tag],
        }));
      }
    } else {
      // Remove tag
      setFeedbackData(prev => ({
        ...prev,
        correctedTags: prev.correctedTags.filter(t => t !== tag),
      }));
    }
  };

  // Add new tag
  const addNewTag = () => {
    if (!newTag) return;
    
    if (!feedbackData.correctedTags.includes(newTag)) {
      setFeedbackData(prev => ({
        ...prev,
        correctedTags: [...prev.correctedTags, newTag],
        missingTags: [...prev.missingTags, newTag],
      }));
    }
    
    setNewTag('');
  };

  // Handle notes change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedbackData(prev => ({
      ...prev,
      feedbackNotes: e.target.value,
    }));
  };

  // Handle rating change
  const handleRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFeedbackData(prev => ({
      ...prev,
      rating: parseInt(e.target.value),
    }));
  };

  // Submit feedback
  const submitFeedback = async () => {
    setLoading(true);
    try {
      // Submit feedback to API
      await mailIngestApi.submitFeedback(attachment.id, feedbackData);
      
      // Call onSubmitFeedback callback with feedback data
      if (onSubmitFeedback) {
        onSubmitFeedback(feedbackData);
      }

      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback! It will help improve our extraction accuracy.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if attachment has processed data
  if (!attachment.processed_data) {
    return (
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        <AlertTitle>Not Processed</AlertTitle>
        <AlertDescription>
          This attachment has not been processed yet. Please process it first to provide feedback.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Box p={4} borderWidth={1} borderRadius="md" bg="white">
      <Heading size="md" mb={4}>Provide Feedback</Heading>
      
      <Text mb={4}>
        Help us improve our extraction accuracy by providing feedback on the extracted data.
        Correct any errors and add any missing information.
      </Text>
      
      <Stack spacing={6}>
        {/* Entity Corrections */}
        <Box>
          <Heading size="sm" mb={3}>Entity Corrections</Heading>
          
          {Object.keys(entityCorrections).length === 0 ? (
            <Text color="gray.500">No entities were extracted from this attachment.</Text>
          ) : (
            <Stack spacing={3}>
              {Object.entries(entityCorrections).map(([key, value]) => (
                <FormControl key={key}>
                  <FormLabel>{key}</FormLabel>
                  <Input 
                    value={value}
                    onChange={(e) => handleEntityCorrectionChange(key, e.target.value)}
                  />
                </FormControl>
              ))}
            </Stack>
          )}
          
          <Divider my={3} />
          
          <Heading size="xs" mb={2}>Add Missing Entity</Heading>
          <Flex gap={2} mb={2}>
            <Input 
              placeholder="Entity name"
              value={newEntityKey}
              onChange={(e) => setNewEntityKey(e.target.value)}
            />
            <Input 
              placeholder="Entity value"
              value={newEntityValue}
              onChange={(e) => setNewEntityValue(e.target.value)}
            />
            <Button onClick={addNewEntity}>Add</Button>
          </Flex>
        </Box>
        
        {/* Tag Corrections */}
        <Box>
          <Heading size="sm" mb={3}>Tag Corrections</Heading>
          
          <Stack spacing={2} mb={3}>
            {['invoice', 'contract', 'report', 'offer', 'photo', 'hvac', 'client_list', 'price_list', 'inventory'].map(tag => (
              <Checkbox 
                key={tag}
                isChecked={feedbackData.correctedTags.includes(tag)}
                onChange={(e) => handleTagChange(tag, e.target.checked)}
              >
                {tag}
              </Checkbox>
            ))}
          </Stack>
          
          <Divider my={3} />
          
          <Heading size="xs" mb={2}>Add Missing Tag</Heading>
          <Flex gap={2} mb={2}>
            <Input 
              placeholder="New tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
            <Button onClick={addNewTag}>Add</Button>
          </Flex>
        </Box>
        
        {/* Rating */}
        <FormControl>
          <FormLabel>Extraction Quality Rating</FormLabel>
          <Select value={feedbackData.rating} onChange={handleRatingChange}>
            <option value={1}>1 - Very Poor</option>
            <option value={2}>2 - Poor</option>
            <option value={3}>3 - Average</option>
            <option value={4}>4 - Good</option>
            <option value={5}>5 - Excellent</option>
          </Select>
        </FormControl>
        
        {/* Notes */}
        <FormControl>
          <FormLabel>Additional Notes</FormLabel>
          <Textarea 
            placeholder="Provide any additional feedback..."
            value={feedbackData.feedbackNotes}
            onChange={handleNotesChange}
          />
        </FormControl>
        
        <Divider />
        
        <Flex justifyContent="flex-end">
          <Button
            leftIcon={<CheckIcon />}
            colorScheme="blue"
            isLoading={loading}
            onClick={submitFeedback}
          >
            Submit Feedback
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
};

export default FeedbackForm;