"use client"

import { useState, useCallback } from "react"

export function useWalletModal() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)

  const openWalletModal = useCallback(() => {
    setIsWalletModalOpen(true)
  }, [])

  const closeWalletModal = useCallback(() => {
    setIsWalletModalOpen(false)
  }, [])

  return {
    isWalletModalOpen,
    openWalletModal,
    closeWalletModal,
    setIsWalletModalOpen,
  }
}
