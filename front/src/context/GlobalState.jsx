import { createContext, useContext, useState } from "react";

const LocalStateContext = createContext();

export const GlobalStateProvider = ({ children }) => {
    const [mapRef, setMapRef] = useState(null)


  return (
    <LocalStateContext.Provider
        value={{
            mapRef, setMapRef,
        }}
    >
        {children}
    </LocalStateContext.Provider>
  )
}

export const useLocalState = () => {
    return useContext(LocalStateContext);
};