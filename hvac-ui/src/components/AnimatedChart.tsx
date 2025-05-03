import { useEffect, useRef } from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { gsap } from 'gsap';
import { useAnimationRef } from '@/hooks/useAnimation';
import { chartAnimation } from '@/utils/animations';

interface AnimatedChartProps {
  data: number[];
  labels?: string[];
  height?: string | number;
  width?: string | number;
  color?: string;
  barColor?: string;
  lineColor?: string;
  animated?: boolean;
  type?: 'bar' | 'line';
}

/**
 * A simple animated chart component using GSAP
 */
export default function AnimatedChart({
  data,
  labels,
  height = '200px',
  width = '100%',
  color,
  barColor,
  lineColor,
  animated = true,
  type = 'bar',
}: AnimatedChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { elementRef: containerRef, animate } = useAnimationRef();
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const defaultBarColor = useColorModeValue('blue.500', 'blue.300');
  const defaultLineColor = useColorModeValue('green.500', 'green.300');
  const gridColor = useColorModeValue('gray.200', 'gray.700');
  
  // Draw the chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Set chart dimensions
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;
    const maxValue = Math.max(...data);
    
    // Draw grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + chartHeight - (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
      
      // Draw y-axis labels
      if (i % 1 === 0) {
        ctx.fillStyle = textColor;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(
          Math.round((i / 5) * maxValue).toString(),
          padding - 5,
          y + 3
        );
      }
    }
    
    // Vertical grid lines and x-axis labels
    const barWidth = chartWidth / data.length;
    for (let i = 0; i <= data.length; i++) {
      const x = padding + i * barWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
      
      // Draw x-axis labels
      if (i < data.length && labels) {
        ctx.fillStyle = textColor;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          labels[i] || i.toString(),
          x + barWidth / 2,
          padding + chartHeight + 15
        );
      }
    }
    
    // Draw data
    if (type === 'bar') {
      // Bar chart
      ctx.fillStyle = barColor || defaultBarColor;
      
      if (animated) {
        // For animation, we'll draw the bars with initial height of 0
        // and then animate them to their full height
        data.forEach((value, index) => {
          const barHeight = 0; // Start with height 0 for animation
          const x = padding + index * barWidth + barWidth * 0.1;
          const y = padding + chartHeight;
          const width = barWidth * 0.8;
          
          ctx.fillRect(x, y, width, barHeight);
          
          // Store the target values for animation
          gsap.to(canvas, {
            onUpdate: () => {
              const progress = gsap.getProperty(canvas, 'progress') || 0;
              const currentHeight = (value / maxValue) * chartHeight * progress;
              
              // Clear and redraw this bar
              ctx.clearRect(x - 1, padding - 1, width + 2, chartHeight + 2);
              ctx.fillRect(x, y - currentHeight, width, currentHeight);
            },
            progress: 1,
            duration: 1,
            ease: 'power2.out',
            delay: index * 0.1,
          });
        });
      } else {
        // No animation, draw bars at full height
        data.forEach((value, index) => {
          const barHeight = (value / maxValue) * chartHeight;
          const x = padding + index * barWidth + barWidth * 0.1;
          const y = padding + chartHeight - barHeight;
          const width = barWidth * 0.8;
          
          ctx.fillRect(x, y, width, barHeight);
        });
      }
    } else if (type === 'line') {
      // Line chart
      ctx.strokeStyle = lineColor || defaultLineColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      if (animated) {
        // For animation, we'll draw the line progressively
        const points = data.map((value, index) => ({
          x: padding + index * barWidth + barWidth / 2,
          y: padding + chartHeight - (value / maxValue) * chartHeight,
        }));
        
        // Draw initial point
        ctx.moveTo(points[0].x, padding + chartHeight);
        
        // Animate the line drawing
        gsap.to(canvas, {
          onUpdate: () => {
            const progress = gsap.getProperty(canvas, 'progress') || 0;
            const pointCount = Math.ceil(points.length * progress);
            
            // Clear and redraw
            ctx.clearRect(0, 0, rect.width, rect.height);
            
            // Redraw grid
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 0.5;
            
            // Horizontal grid lines
            for (let i = 0; i <= 5; i++) {
              const y = padding + chartHeight - (i / 5) * chartHeight;
              ctx.beginPath();
              ctx.moveTo(padding, y);
              ctx.lineTo(padding + chartWidth, y);
              ctx.stroke();
              
              // Draw y-axis labels
              if (i % 1 === 0) {
                ctx.fillStyle = textColor;
                ctx.font = '10px Inter, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(
                  Math.round((i / 5) * maxValue).toString(),
                  padding - 5,
                  y + 3
                );
              }
            }
            
            // Vertical grid lines and x-axis labels
            for (let i = 0; i <= data.length; i++) {
              const x = padding + i * barWidth;
              ctx.beginPath();
              ctx.moveTo(x, padding);
              ctx.lineTo(x, padding + chartHeight);
              ctx.stroke();
              
              // Draw x-axis labels
              if (i < data.length && labels) {
                ctx.fillStyle = textColor;
                ctx.font = '10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(
                  labels[i] || i.toString(),
                  x + barWidth / 2,
                  padding + chartHeight + 15
                );
              }
            }
            
            // Draw line
            ctx.strokeStyle = lineColor || defaultLineColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            
            for (let i = 1; i < pointCount; i++) {
              ctx.lineTo(points[i].x, points[i].y);
            }
            
            ctx.stroke();
            
            // Draw points
            ctx.fillStyle = lineColor || defaultLineColor;
            for (let i = 0; i < pointCount; i++) {
              ctx.beginPath();
              ctx.arc(points[i].x, points[i].y, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          },
          progress: 1,
          duration: 1.5,
          ease: 'power2.out',
        });
      } else {
        // No animation, draw line at once
        data.forEach((value, index) => {
          const x = padding + index * barWidth + barWidth / 2;
          const y = padding + chartHeight - (value / maxValue) * chartHeight;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        
        ctx.stroke();
        
        // Draw points
        ctx.fillStyle = lineColor || defaultLineColor;
        data.forEach((value, index) => {
          const x = padding + index * barWidth + barWidth / 2;
          const y = padding + chartHeight - (value / maxValue) * chartHeight;
          
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
  }, [data, labels, type, animated, barColor, lineColor, defaultBarColor, defaultLineColor, gridColor, textColor]);
  
  // Apply container animation
  useEffect(() => {
    if (animated && containerRef.current) {
      animate(() => chartAnimation(containerRef.current as HTMLElement));
    }
  }, [animate, animated]);
  
  return (
    <Box
      ref={containerRef}
      height={height}
      width={width}
      position="relative"
      bg={bgColor}
      borderRadius="md"
      overflow="hidden"
      opacity={animated ? 0 : 1} // Start with opacity 0 for animation
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </Box>
  );
}