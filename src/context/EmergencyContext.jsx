import React, { createContext, useReducer, useContext } from 'react';

const initialState = {
  isEmergencyMode: false,
  activatedAt: null,
  activatedBy: null
};

const emergencyReducer = (state, action) => {
  switch (action.type) {
    case 'ACTIVATE_EMERGENCY':
      return {
        isEmergencyMode: true,
        activatedAt: new Date().toISOString(),
        activatedBy: action.payload?.activatedBy || null
      };
    case 'DEACTIVATE_EMERGENCY':
      return initialState;
    default:
      return state;
  }
};

export const EmergencyContext = createContext();

export const EmergencyProvider = ({ children }) => {
  const [state, dispatch] = useReducer(emergencyReducer, initialState);

  const activateEmergency = (data = {}) => {
    dispatch({ type: 'ACTIVATE_EMERGENCY', payload: data });
  };

  const deactivateEmergency = () => {
    dispatch({ type: 'DEACTIVATE_EMERGENCY' });
  };

  const toggleEmergency = (data = {}) => {
    if (state.isEmergencyMode) {
      deactivateEmergency();
    } else {
      activateEmergency(data);
    }
  };

  return (
    <EmergencyContext.Provider value={{ 
      ...state, 
      activateEmergency, 
      deactivateEmergency, 
      toggleEmergency 
    }}>
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};
