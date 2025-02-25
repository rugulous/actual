// @ts-strict-ignore
import { type FormEvent, useState } from 'react';
import { Form } from 'react-aria-components';
import { useTranslation, Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { FormError } from '@actual-app/components/form-error';
import { InitialFocus } from '@actual-app/components/initial-focus';
import { InlineField } from '@actual-app/components/inline-field';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { pushModal } from 'loot-core/client/actions';
import { send } from 'loot-core/platform/client/fetch';

import { useDispatch } from '../../redux';
import { theme } from '../../style';
import { Input } from '../common/Input';
import {
  Modal,
  ModalButtons,
  ModalCloseButton,
  ModalHeader,
  ModalTitle,
} from '../common/Modal';

export function LinkTrading212Modal() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [apiKey, setApiKey] = useState('');
  const [apiKeyError, setApiKeyError] = useState(null);

  const validateApiKey = (key: string) => {
    if (key.trim().length === 0) {
      return t('Key cannot be empty.');
    }
  };

  const validateAndSetApiKey = (key: string) => {
    const error = validateApiKey(key);
    if (error) {
      setApiKeyError(error);
    } else {
      setApiKey(key);
      setApiKeyError(null);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const apiKeyError = validateApiKey(apiKey);
    setApiKeyError(apiKeyError);

    if (!apiKeyError) {
      const balance = await send('get-t212-balance', {
        apiKey,
      });

      if (isNaN(balance)) {
        setApiKeyError(balance);
        return;
      }

      dispatch(
        pushModal('select-linked-accounts', {
          accounts: [
            {
              account_id: crypto.randomUUID(),
              name: 'Trading 212 Account',
              balance,
              offbudget: true,
            },
          ],
          requisitionId: apiKey,
          syncSource: 't212',
        }),
      );
    }
  };
  return (
    <Modal
      name="link-trading-212"
      containerProps={{ style: { width: '30vw' } }}
    >
      {({ state: { close } }) => (
        <>
          <ModalHeader
            title={
              <ModalTitle
                title={t('Connect to Trading 212')}
                shrinkOnOverflow
              />
            }
            rightContent={<ModalCloseButton onPress={close} />}
          />
          <View>
            <Text>
              <Trans>
                In order to retrieve real-time data from Trading 212 you need to
                create access credentials. This can be done by creating a
                Trading 212 API Key (under Settings &gt; API)
              </Trans>
            </Text>

            <Form onSubmit={onSubmit}>
              <InlineField label={t('API Key')} width="100%">
                <InitialFocus>
                  <Input
                    name="key"
                    value={apiKey}
                    onChange={event => setApiKey(event.target.value)}
                    onBlur={event => {
                      const key = event.target.value.trim();
                      validateAndSetApiKey(key);
                    }}
                    style={{ flex: 1 }}
                  />
                </InitialFocus>
              </InlineField>
              {apiKeyError && (
                <FormError style={{ marginLeft: 75, color: theme.warningText }}>
                  {apiKeyError}
                </FormError>
              )}

              <ModalButtons>
                <Button onPress={close}>{t('Back')}</Button>
                <Button
                  type="submit"
                  variant="primary"
                  style={{ marginLeft: 10 }}
                >
                  {t('Create')}
                </Button>
              </ModalButtons>
            </Form>
          </View>
        </>
      )}
    </Modal>
  );
}
