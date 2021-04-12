import React, { createContext, useCallback, useEffect, useState } from 'react'
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'
import useConnection from '../hooks/useConnection'
import useWallet from '../hooks/useWallet'
import { TokenAccount } from '../types'

const OwnedTokenAccountsContext = createContext({})

const getOwnedTokenAccountsFilter = (publicKey) => [
  {
    memcmp: {
      offset: AccountLayout.offsetOf('owner'),
      bytes: publicKey?.toBase58(),
    },
  },
  {
    dataSize: AccountLayout.span,
  },
]

const convertAccountInfoToLocalStruct = (
  _accountInfo,
  pubkey,
): TokenAccount => {
  const amountBuffer = Buffer.from(_accountInfo.amount)
  const amount = amountBuffer.readUIntLE(0, 8)
  return {
    amount,
    mint: new PublicKey(_accountInfo.mint),
    // public key for the specific token account (NOT the wallet)
    pubKey: new PublicKey(pubkey),
  }
}

/**
 * State for the Wallet's SPL accounts and solana account
 *
 */
const OwnedTokenAccountsProvider: React.FC = ({ children }) => {
  const { connection } = useConnection()
  const { connected, pubKey } = useWallet()
  const [loadingOwnedTokenAccounts, setLoading] = useState(false)
  const [ownedTokenAccounts, setOwnedTokenAccounts] = useState<
    Record<string, TokenAccount[]>
  >({})
  const [refreshCount, setRefreshCount] = useState(0)
  const refreshTokenAccounts = useCallback(() => {
    setRefreshCount((count) => count + 1)
  }, [])

  useEffect(() => {
    if (!connected || !pubKey) {
      // short circuit when there is no wallet connected
      return () => {}
    }

    let subscriptionIds
    ;(async () => {
      const filters = getOwnedTokenAccountsFilter(pubKey)
      setLoading(true)
      // @ts-expect-error we know what we're doing
      const resp = await connection._rpcRequest('getProgramAccounts', [
        TOKEN_PROGRAM_ID.toBase58(),
        {
          commitment: connection.commitment,
          filters,
        },
      ])
      const _ownedTokenAccounts = {}
      subscriptionIds = resp.result?.map(({ account, pubkey }) => {
        const accountInfo = AccountLayout.decode(bs58.decode(account.data))
        const initialAccount = convertAccountInfoToLocalStruct(
          accountInfo,
          pubkey,
        )
        const mint = initialAccount.mint.toString()
        if (_ownedTokenAccounts[mint]) {
          _ownedTokenAccounts[mint].push(initialAccount)
        } else {
          _ownedTokenAccounts[mint] = [initialAccount]
        }
        // subscribe to the SPL token account updates
        return connection.onAccountChange(new PublicKey(pubkey), (_account) => {
          const listenerAccountInfo = AccountLayout.decode(_account.data)
          const listenerAccount = convertAccountInfoToLocalStruct(
            listenerAccountInfo,
            pubkey,
          )
          setOwnedTokenAccounts((prevOwnedTokenAccounts) => {
            const mintAsString = listenerAccount.mint.toString()
            const prevMintState = prevOwnedTokenAccounts[mintAsString]
            const index = prevMintState.findIndex(
              (prevAccount) => prevAccount.pubKey.toString() === pubkey,
            )
            // replace prev state with updated state
            const mintState = Object.assign([], prevMintState, {
              [index]: listenerAccount,
            })
            return {
              ...prevOwnedTokenAccounts,
              [mintAsString]: mintState,
            }
          })
        })
      })
      setOwnedTokenAccounts(_ownedTokenAccounts)
      setLoading(false)
    })()

    return () => {
      if (subscriptionIds) {
        subscriptionIds.forEach(connection.removeAccountChangeListener)
      }
    }
  }, [connected, connection, pubKey, refreshCount])

  return (
    <OwnedTokenAccountsContext.Provider
      value={{
        loadingOwnedTokenAccounts,
        ownedTokenAccounts,
        refreshTokenAccounts,
      }}
    >
      {children}
    </OwnedTokenAccountsContext.Provider>
  )
}

export { OwnedTokenAccountsContext, OwnedTokenAccountsProvider }
