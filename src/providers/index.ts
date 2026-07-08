/**
 * Architecture Providers
 * 
 * Sets up state managers, injection scopes, and multi-tenant custom providers.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { container } from '../services/serviceContainer';

// Create a context that holds our Dependency Injection Service Container
const ServiceContainerContext = createContext(container);

export interface ServiceProviderProps {
  children: ReactNode;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children }) => {
  return (
    React.createElement(ServiceContainerContext.Provider, { value: container }, children)
  );
};

export const useServices = () => {
  return useContext(ServiceContainerContext);
};
