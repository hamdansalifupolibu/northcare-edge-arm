import { AppCard } from '../cards/AppCard';
import { AppText } from '../text/AppText';
import { SYNC_COPY } from './syncCopy';

export type OfflineNoticeProps = {
  readonly message?: string;
  readonly testID?: string;
};

export function OfflineNotice({
  message = SYNC_COPY.waitingForConnection,
  testID,
}: OfflineNoticeProps) {
  return (
    <AppCard testID={testID} title="Working offline">
      <AppText variant="body" color="secondary">
        {message}
      </AppText>
      <AppText variant="caption" color="secondary">
        {SYNC_COPY.savedLocally}
      </AppText>
    </AppCard>
  );
}
