import Box from '@material-ui/core/Box'
import React, { useCallback, useState } from 'react'
import BigNumber from 'bignumber.js'
import {
  useSettleFunds,
  useSubscribeOpenOrders,
  useUnsettledFundsForMarket,
} from '../../hooks/Serum'
import TxButton from '../TxButton'

/**
 * UI for showing the user their unsettled funds for an single option market.
 */
export const UnsettledFunds: React.VFC<{
  qAssetSymbol: string
  serumMarketAddress: string
  qAssetDecimals: number
}> = ({ qAssetSymbol, serumMarketAddress, qAssetDecimals }) => {
  const unsettledFunds = useUnsettledFundsForMarket(serumMarketAddress)
  const { settleFunds } = useSettleFunds(serumMarketAddress)
  useSubscribeOpenOrders(serumMarketAddress)
  const [loading, setLoading] = useState(false)
  const _settleFunds = useCallback(async () => {
    setLoading(true)
    await settleFunds()
    setLoading(false)
  }, [settleFunds])

  if (
    unsettledFunds.baseFree.toNumber() <= 0 &&
    unsettledFunds.quoteFree.toNumber() <= 0
  ) {
    // no need to show the unsetlled funds when the user has none
    return null
  }

  const valueUnsettled = new BigNumber(unsettledFunds.quoteFree.toString())
  return (
    <Box justifyContent="flex-end" textAlign="center" width="100%">
      Unsettled Funds
      <Box display="flex" flex="1" justifyContent="space-between" my={2}>
        <Box>Options: {unsettledFunds.baseFree.toString()}</Box>
        <Box>
          {qAssetSymbol}:{' '}
          {valueUnsettled.dividedBy(10 ** qAssetDecimals).toString()}
        </Box>
      </Box>
      <TxButton
        color="primary"
        onClick={_settleFunds}
        variant="outlined"
        loading={loading}
      >
        {loading ? 'Settling Funds' : 'Settle Funds'}
      </TxButton>
    </Box>
  )
}
