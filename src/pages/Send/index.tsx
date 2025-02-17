import { ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useRecoilState, useRecoilValue } from 'recoil'
import _ from 'lodash'

import loading from 'images/loading.gif'
import failed from 'images/failed.gif'
import complete from 'images/complete.gif'

import { COLOR, STYLE } from 'consts'

import SendProcessStore, { ProcessStatus } from 'store/SendProcessStore'

import useSendValidate from 'hooks/useSendValidate'

import { Container } from 'components'
import FormTitle from './FormTitle'
import SendForm from './SendForm'
import Confirm from './Confirm'
import Finish from './Finish'
import SendFormButton from './SendFormButton'
import BlockChainNetwork from './BlockChainNetwork'
import FormImage from 'components/FormImage'
import FinishButton from './FinishButton'
import AuthStore from 'store/AuthStore'
import useAuth from 'hooks/useAuth'
import SendStore from 'store/SendStore'
import useSelectWallet from 'hooks/useSelectWallet'
import { BlockChainType, BridgeType } from 'types/network'
import testnetSvg from '../../images/testnet.svg'
import NetworkStore from 'store/NetworkStore'
import {
  InfoElement,
  WarningElement,
  WarningInfo,
} from './SendForm/WarningInfo'

const StyledProcessCircle = styled.div`
  height: 128px;
  width: 128px;
  margin: auto;
  border-radius: 100px;
  border: 1px solid #4abcf0;
  box-shadow: 0 2px 4px 0 rgba(15, 15, 24, 0.3),
    0 -1px 4px 0 rgba(119, 232, 255, 0.5);
  align-items: center;
  justify-content: center;
`

const StyledContainer = styled(Container)`
  max-width: 640px;
  padding: 0;
  height: 100%;
  @media ${STYLE.media.mobile} {
    width: 100vw;
    overflow-x: hidden;
  }
`

const StyledForm = styled.div`
  position: relative;
  background-color: ${COLOR.black};
  padding: 60px;
  border-radius: 2em;
  @media ${STYLE.media.mobile} {
    border-radius: 0;
    padding: 38px 24px 20px;
  }
`

const TestnetImg = styled.img`
  position: absolute;
  top: 0;
  right: 0;
`

const Send = (): ReactElement => {
  const formScrollView = useRef<HTMLDivElement>(null)

  const [status, setStatus] = useRecoilState(SendProcessStore.sendProcessStatus)
  const isLoggedIn = useRecoilValue(AuthStore.isLoggedIn)
  const { getLoginStorage, logout } = useAuth()
  const [initPage, setInitPage] = useState(false)
  const [toBlockChain, setToBlockChain] = useRecoilState(SendStore.toBlockChain)
  const [fromBlockChain, setFromBlockChain] = useRecoilState(
    SendStore.fromBlockChain
  )
  const [bridgeUsed, setBridgeUsed] = useRecoilState(SendStore.bridgeUsed)
  const isTestnet = useRecoilValue(NetworkStore.isTestnet)

  const { validateFee } = useSendValidate()
  const feeValidationResult = validateFee()

  const renderProcessStatus = useCallback((): ReactElement => {
    switch (status) {
      case ProcessStatus.Done:
        return (
          <StyledProcessCircle>
            <FormImage src={complete} />
          </StyledProcessCircle>
        )
      case ProcessStatus.Failed:
        return (
          <StyledProcessCircle
            style={{
              boxShadow:
                '0 2px 4px 0 rgba(254, 99, 99, 0.3), 0 -1px 4px 0 rgba(255, 119, 119, 0.5)',
              border: 'solid 1px #ff5964',
            }}
          >
            <FormImage src={failed} />
          </StyledProcessCircle>
        )
      case ProcessStatus.Pending:
        return (
          <StyledProcessCircle style={{ marginBottom: 60 }}>
            <FormImage
              src={loading}
              size={140}
              style={{ marginLeft: -6, marginTop: -6 }}
            />
          </StyledProcessCircle>
        )
      default:
        return (
          <div style={{ marginBottom: 100 }}>
            <BlockChainNetwork />
          </div>
        )
    }
  }, [status])

  const onClickGoBackToSendInputButton = async (): Promise<void> => {
    setStatus(ProcessStatus.Input)
  }

  const selectWallet = useSelectWallet()

  useEffect(() => {
    setInitPage(true)
    const { lastFromBlockChain, lastToBlockChain, bridgeUsed } =
      getLoginStorage()

    // TODO: remove after Axelar intagration
    if (
      bridgeUsed !== BridgeType.ibc &&
      bridgeUsed !== BridgeType.axelar &&
      fromBlockChain !== BlockChainType.ethereum
    ) {
      logout()
      setToBlockChain(BlockChainType.terra)
      setBridgeUsed(BridgeType.axelar)
      setFromBlockChain(BlockChainType.ethereum)
    } else if (false === isLoggedIn && lastFromBlockChain) {
      // default network is terra
      if (lastFromBlockChain === BlockChainType.terra) {
        selectWallet.open()
      } else {
        setFromBlockChain(lastFromBlockChain)
      }
      lastToBlockChain && setToBlockChain(lastToBlockChain)
      bridgeUsed &&
        lastToBlockChain !== lastFromBlockChain &&
        setBridgeUsed(bridgeUsed)
    }
  }, [])

  useEffect(() => {
    if (initPage) {
      if (false === isLoggedIn) {
        selectWallet.open()
      }

      if (
        fromBlockChain !== BlockChainType.terra &&
        fromBlockChain !== toBlockChain
      ) {
        setToBlockChain(BlockChainType.terra)
      }
    }
  }, [fromBlockChain])

  useEffect(() => {
    const scroll = formScrollView.current
    if (scroll) {
      if (status === ProcessStatus.Input) {
        scroll.scrollTo({ left: 0, behavior: 'smooth' })
      } else if (status === ProcessStatus.Confirm) {
        scroll.scrollTo({ left: 600, behavior: 'smooth' })
      }
    }
  }, [status])

  return (
    <StyledContainer>
      <StyledForm key={_.toString(isLoggedIn)}>
        {isTestnet && <TestnetImg src={testnetSvg} />}

        {/* FormTitle */}
        <FormTitle
          onClickGoBackToSendInputButton={onClickGoBackToSendInputButton}
        />

        {/* Select From, To Blockchain Network */}
        <div style={{ textAlign: 'center' }}>{renderProcessStatus()}</div>

        {[ProcessStatus.Done, ProcessStatus.Failed].includes(status) ? (
          <>
            <Finish />
            <WarningInfo />
            <FinishButton />
          </>
        ) : (
          <>
            <div style={{ marginTop: -40 }}>
              <div style={{ marginTop: -40 }}>
                <InfoElement>
                  This is Bridge V2, if you want to use bridge with Terra
                  Classic please visit{' '}
                  <a href="https://classic-bridge.terra.money">
                    classic-bridge.terra.money
                  </a>
                </InfoElement>
              </div>
            </div>

            <div
              ref={formScrollView}
              style={{ display: 'flex', overflowX: 'hidden' }}
            >
              <div style={{ minWidth: '100%' }}>
                <SendForm feeValidationResult={feeValidationResult} />
              </div>
              <div style={{ minWidth: '100%' }}>
                <Confirm />
                <div style={{ marginTop: -40 }}>
                  {bridgeUsed === BridgeType.axelar && (
                    <div style={{ marginTop: 60 }}>
                      <WarningElement>
                        The{' '}
                        {fromBlockChain === BlockChainType.terra
                          ? 'Station'
                          : 'MetaMask'}{' '}
                        popup may take a few seconds to open. Please don't
                        refresh or close this page in the meantime.
                      </WarningElement>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <WarningInfo />

            {[
              ProcessStatus.Input,
              ProcessStatus.Submit,
              ProcessStatus.Confirm,
            ].includes(status) && (
              <SendFormButton feeValidationResult={feeValidationResult} />
            )}
          </>
        )}
      </StyledForm>
    </StyledContainer>
  )
}

export default Send
