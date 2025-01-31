import styled, { keyframes } from 'styled-components';

export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-start;
  }
`;

export const ModalContent = styled.div`
  background: #f8f9fd;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: auto;
  padding: 2rem;

  @media (max-width: 768px) {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    padding: 1rem;
  }
`;

export const TabContainer = styled.div`
  display: flex;
  gap: 2px;
  background: #e0e0e0;
  padding: 2px;
  border-radius: 8px;
  margin-bottom: 2rem;

  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
`;

export const Tab = styled.button<{ active: boolean }>`
  padding: 1rem 2rem;
  background: ${props => props.active ? '#ffffff' : 'transparent'};
  border: none;
  border-radius: 6px;
  color: ${props => props.active ? '#1a237e' : '#546e7a'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
`;



export const SearchContainer = styled.div`
  padding: 1rem;
  background: #ffffff;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }

  &::placeholder {
    color: #9e9e9e;
  }
`;

export const HistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

export const OrdersList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fd;
  border-radius: 8px;

  @media (max-width: 768px) {
    display: flex;
    overflow-x: auto;
    padding: 0.5rem;
    gap: 0.75rem;
    -webkit-overflow-scrolling: touch;
    
    &::-webkit-scrollbar {
      height: 4px;
    }
  }
`;

export const OrderCard = styled.div<{ selected: boolean }>`
  padding: 1.5rem;
  background: ${props => props.selected ? '#e3f2fd' : 'white'};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid ${props => props.selected ? '#2196f3' : 'transparent'};

  @media (max-width: 768px) {
    flex: 0 0 280px;
    padding: 1rem;
  }
`;

export const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

export const ActiveCard = styled(Card)`
  border-left: 4px solid #4caf50;
  background: linear-gradient(to right, #ffffff, #f8f9fd);
`;

export const DetailsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-top: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

export const TimelineContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 500px;
  overflow-y: auto;
  padding: 1.5rem;
  margin: -1.5rem;
  position: relative;

  @media (max-width: 768px) {
    height: 400px;
    padding: 1rem;
    margin: -1rem;
  }
`;

export const TimelineConnector = styled.div`
  position: absolute;
  left: 2rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e0e0e0;
  z-index: 0;
`;

export const TimelineEvent = styled.div<{ type: 'start' | 'end' | 'pause' | 'resume' }>`
  position: relative;
  margin-left: 4rem;
  z-index: 1;
  padding: 1rem;
  background: ${props => {
    switch (props.type) {
      case 'start': return '#e8f5e9';
      case 'end': return '#ffebee';
      case 'pause': return '#fff3e0';
      case 'resume': return '#e3f2fd';
    }
  }};
  border-radius: 8px;
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'start': return '#4caf50';
      case 'end': return '#f44336';
      case 'pause': return '#ff9800';
      case 'resume': return '#2196f3';
    }
  }};

  @media (max-width: 768px) {
    margin-left: 3rem;
    padding: 0.75rem;
  }

  @media (max-width: 480px) {
    margin-left: 2.5rem;
    font-size: 0.875rem;
  }
`;

export const TimelineDot = styled.div<{ type: 'start' | 'end' | 'pause' | 'resume' }>`
  position: absolute;
  left: -4rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: ${props => {
    switch (props.type) {
      case 'start': return '#4caf50';
      case 'end': return '#f44336';
      case 'pause': return '#ff9800';
      case 'resume': return '#2196f3';
    }
  }};
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 2;
`;

export const Title = styled.h2`
  color: #1a237e;
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 1.25rem;
    margin: 0 0 0.75rem 0;
  }
`;

export const Subtitle = styled.h3`
  color: #3949ab;
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

export const Text = styled.p`
  color: #546e7a;
  margin: 0.25rem 0;
  line-height: 1.5;
`;

export const Button = styled.button`
  background: #3f51b5;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 0.8125rem;
  }

  &:hover {
    background: #303f9f;
  }

  &:active {
    background: #283593;
  }
`;

export const LoadingSpinner = styled.div`
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3f51b5;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const TimerContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

export const MainTimer = styled.div`
  grid-column: 1 / -1;
  background: #f8f9fd;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  position: relative;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

export const TimerValue = styled.div`
  font-family: 'Roboto Mono', monospace;
  font-size: 3rem;
  font-weight: 700;
  color: #1a237e;
  letter-spacing: 2px;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }

  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

export const TimerLabel = styled.div`
  font-size: 0.875rem;
  color: #546e7a;
  margin-top: 0.5rem;
`;

export const PauseIndicator = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #ff9800;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
  animation: ${fadeIn} 0.3s ease;
`;

export const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const StatsSection = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 0;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const StatCard = styled.div<{ highlight?: boolean }>`
  background: ${props => props.highlight ? '#e3f2fd' : '#f5f5f5'};
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid ${props => props.highlight ? '#bbdefb' : 'transparent'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
`;

export const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a237e;
  margin: 0.5rem 0;
  font-family: 'Roboto Mono', monospace;
`;

export const StatLabel = styled.div`
  color: #546e7a;
  font-size: 0.875rem;
`;