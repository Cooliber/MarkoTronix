# OpenAI API Issues Runbook

This runbook provides guidance on handling OpenAI API issues in the HVAC CRM system.

## Overview

The offer generation service uses OpenAI API for generating offer content. This runbook covers procedures for handling OpenAI API issues and recovery.

## Monitoring OpenAI API Health

### Health Check Endpoints

The offer generation service exposes a health check endpoint that includes the status of the OpenAI API connection:

- Offer Generation Service: http://localhost:18002/health

### Prometheus Alerts

Prometheus is configured to alert when:
- The OpenAI circuit breaker is open for more than 5 minutes
- OpenAI API calls have a high 95th percentile latency (> 5s over 5 minutes)

## Common OpenAI API Issues and Resolution

### OpenAI API Connection Failures

**Symptoms**:
- Offer generation service reports OpenAI API connection failures in health checks
- Offer generation service logs OpenAI API connection errors
- OpenAI circuit breaker is open
- Prometheus alert for OpenAICircuitBreakerOpen is triggered

**Resolution**:

1. Check if the OpenAI API is available:
   - Visit the [OpenAI Status Page](https://status.openai.com/)
   - Check if there are any reported outages or incidents

2. Check if the API key is valid:
   - Verify that the `OPENAI_API_KEY` environment variable is set correctly
   - Check if the API key has expired or been revoked
   - Test the API key with a simple curl command:
     ```bash
     curl -X POST https://api.openai.com/v1/chat/completions \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer $OPENAI_API_KEY" \
       -d '{
         "model": "gpt-3.5-turbo",
         "messages": [{"role": "user", "content": "Hello!"}]
       }'
     ```

3. Check if the API key has reached its rate limit:
   - Check the OpenAI API usage dashboard
   - If rate limited, wait for the rate limit to reset or increase the limit

4. Check if the API key has reached its quota:
   - Check the OpenAI API usage dashboard
   - If quota is reached, upgrade the plan or wait for the next billing cycle

5. If the OpenAI API is unavailable, switch to OpenRouter:
   - Verify that the `OPENROUTER_API_KEY` environment variable is set correctly
   - Update the `use_openrouter` parameter in the `call_llm_api` function to `True`

6. Reset the circuit breaker:
   ```bash
   curl -X POST http://localhost:18002/circuit-breakers/openai/reset
   ```

7. Verify that the offer generation service can connect to the OpenAI API by checking its health endpoint.

### OpenAI API High Latency

**Symptoms**:
- Offer generation service reports high OpenAI API latency in metrics
- Prometheus alert for HighOpenAILatency is triggered

**Resolution**:

1. Check if the OpenAI API is experiencing high load:
   - Visit the [OpenAI Status Page](https://status.openai.com/)
   - Check if there are any reported performance issues

2. Check if the network connection is stable:
   - Run a ping test to the OpenAI API endpoint
   - Check if there are any network issues between the service and the OpenAI API

3. Consider switching to a faster model:
   - Update the `DEFAULT_LLM_MODEL` environment variable to a faster model
   - For example, change from `gpt-4` to `gpt-3.5-turbo`

4. Consider switching to OpenRouter:
   - Verify that the `OPENROUTER_API_KEY` environment variable is set correctly
   - Update the `use_openrouter` parameter in the `call_llm_api` function to `True`

5. Implement caching for common requests:
   - Use Redis to cache responses for common prompts
   - Implement a local cache for frequently used templates

### OpenAI API Rate Limiting

**Symptoms**:
- Offer generation service logs rate limit errors
- OpenAI circuit breaker is open
- Prometheus alert for OpenAICircuitBreakerOpen is triggered

**Resolution**:

1. Check if the API key has reached its rate limit:
   - Check the OpenAI API usage dashboard
   - If rate limited, wait for the rate limit to reset

2. Implement rate limiting in the service:
   - Add a rate limiter to the `call_openai_api` function
   - Use Redis to track API calls and enforce rate limits

3. Implement exponential backoff for retries:
   - Add exponential backoff to the `call_openai_api` function
   - Increase the wait time between retries

4. Consider upgrading the OpenAI API plan:
   - Upgrade to a higher tier plan with higher rate limits
   - Contact OpenAI support for custom rate limits

5. Consider switching to OpenRouter:
   - Verify that the `OPENROUTER_API_KEY` environment variable is set correctly
   - Update the `use_openrouter` parameter in the `call_llm_api` function to `True`

## Fallback Strategies

If the OpenAI API is unavailable or experiencing issues, consider the following fallback strategies:

1. **Switch to OpenRouter**:
   - OpenRouter provides access to multiple LLM providers
   - Update the `use_openrouter` parameter in the `call_llm_api` function to `True`

2. **Use Pre-Generated Templates**:
   - Store pre-generated templates for common offer types
   - Use these templates when the OpenAI API is unavailable

3. **Implement a Local LLM**:
   - Deploy a local LLM like Llama 2 or Mistral
   - Use the local LLM when the OpenAI API is unavailable

4. **Manual Offer Generation**:
   - Provide a UI for manual offer generation
   - Allow users to create offers without AI assistance

## Preventive Measures

To prevent OpenAI API issues:

1. **Monitor API Usage**:
   - Set up alerts for approaching rate limits
   - Set up alerts for approaching quotas

2. **Implement Circuit Breakers**:
   - Use circuit breakers for all OpenAI API calls
   - Configure appropriate thresholds and timeouts

3. **Implement Retry Mechanisms**:
   - Use exponential backoff for retries
   - Set appropriate retry limits

4. **Implement Fallback Mechanisms**:
   - Provide fallback functionality when the OpenAI API is unavailable
   - Implement multiple LLM providers

5. **Implement Caching**:
   - Cache responses for common prompts
   - Implement a local cache for frequently used templates

## Escalation Path

If you are unable to resolve an OpenAI API issue, escalate to the appropriate team:

1. **Level 1**: On-call engineer
2. **Level 2**: AI team
3. **Level 3**: Engineering manager
4. **Level 4**: CTO