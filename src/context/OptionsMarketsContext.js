import React, { useState, createContext } from 'react'
import PropTypes from 'prop-types'

const OptionsMarketsContext = createContext()

const OptionsMarketsProvider = ({ children }) => {
  const [markets, setMarkets] = useState({})
  const [serumMarkets, setSerumMarkets] = useState({})
  const [marketsLoading, setMarketsLoading] = useState(false)

  return (
    <OptionsMarketsContext.Provider
      value={{
        markets,
        setMarkets,
        marketsLoading,
        setMarketsLoading,
        serumMarkets,
        setSerumMarkets,
      }}
    >
      {children}
    </OptionsMarketsContext.Provider>
  )
}

OptionsMarketsProvider.propTypes = {
  children: PropTypes.node,
}

OptionsMarketsProvider.defaultProps = {
  children: null,
}

export { OptionsMarketsContext, OptionsMarketsProvider }
