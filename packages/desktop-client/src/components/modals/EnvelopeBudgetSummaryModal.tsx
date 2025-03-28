import React from 'react';
import { useTranslation } from 'react-i18next';

import { styles } from '@actual-app/components/styles';

import { collapseModals, pushModal } from 'loot-core/client/actions';
import { envelopeBudget } from 'loot-core/client/queries';
import { format, sheetForMonth, prevMonth } from 'loot-core/shared/months';
import { groupById, integerToCurrency } from 'loot-core/shared/util';

import { useCategories } from '../../hooks/useCategories';
import { useUndo } from '../../hooks/useUndo';
import { useDispatch } from '../../redux';
import { ToBudgetAmount } from '../budget/envelope/budgetsummary/ToBudgetAmount';
import { TotalsList } from '../budget/envelope/budgetsummary/TotalsList';
import { useEnvelopeSheetValue } from '../budget/envelope/EnvelopeBudgetComponents';
import { Modal, ModalCloseButton, ModalHeader } from '../common/Modal';
import { NamespaceContext } from '../spreadsheet/NamespaceContext';

type EnvelopeBudgetSummaryModalProps = {
  onBudgetAction: (month: string, action: string, arg?: unknown) => void;
  month: string;
};

export function EnvelopeBudgetSummaryModal({
  month,
  onBudgetAction,
}: EnvelopeBudgetSummaryModalProps) {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const prevMonthName = format(prevMonth(month), 'MMM');
  const sheetValue =
    useEnvelopeSheetValue({
      name: envelopeBudget.toBudget,
      value: 0,
    }) ?? 0;

  const { showUndoNotification } = useUndo();
  const { list: categories } = useCategories();
  const categoriesById = groupById(categories);

  const openTransferAvailableModal = () => {
    dispatch(
      pushModal('transfer', {
        title: t('Transfer to category'),
        month,
        amount: sheetValue,
        onSubmit: (amount, toCategoryId) => {
          onBudgetAction(month, 'transfer-available', {
            amount,
            month,
            category: toCategoryId,
          });
          dispatch(collapseModals('transfer'));
          showUndoNotification({
            message: t('Transferred {{amount}} to {{categoryName}}', {
              amount: integerToCurrency(amount),
              categoryName: categoriesById[toCategoryId].name,
            }),
          });
        },
      }),
    );
  };

  const openCoverOverbudgetedModal = () => {
    dispatch(
      pushModal('cover', {
        title: t('Cover overbudgeted'),
        month,
        showToBeBudgeted: false,
        onSubmit: categoryId => {
          onBudgetAction(month, 'cover-overbudgeted', {
            category: categoryId,
          });
          dispatch(collapseModals('cover'));
          showUndoNotification({
            message: t('Covered overbudgeted from {{categoryName}}', {
              categoryName: categoriesById[categoryId].name,
            }),
          });
        },
      }),
    );
  };

  const onHoldBuffer = () => {
    dispatch(
      pushModal('hold-buffer', {
        month,
        onSubmit: amount => {
          onBudgetAction(month, 'hold', { amount });
          dispatch(collapseModals('hold-buffer'));
        },
      }),
    );
  };

  const onResetHoldBuffer = () => {
    onBudgetAction(month, 'reset-hold');
  };

  const onClick = ({ close }: { close: () => void }) => {
    dispatch(
      pushModal('envelope-summary-to-budget-menu', {
        month,
        onTransfer: openTransferAvailableModal,
        onCover: openCoverOverbudgetedModal,
        onResetHoldBuffer: () => {
          onResetHoldBuffer();
          close();
        },
        onHoldBuffer,
      }),
    );
  };

  return (
    <Modal name="envelope-budget-summary">
      {({ state: { close } }) => (
        <>
          <ModalHeader
            title={t('Budget Summary')}
            rightContent={<ModalCloseButton onPress={close} />}
          />
          <NamespaceContext.Provider value={sheetForMonth(month)}>
            <TotalsList
              prevMonthName={prevMonthName}
              style={{
                ...styles.mediumText,
              }}
            />
            <ToBudgetAmount
              prevMonthName={prevMonthName}
              style={{
                ...styles.mediumText,
                marginTop: 15,
              }}
              amountStyle={{
                ...styles.underlinedText,
              }}
              onClick={() => onClick({ close })}
              isTotalsListTooltipDisabled={true}
            />
          </NamespaceContext.Provider>
        </>
      )}
    </Modal>
  );
}
