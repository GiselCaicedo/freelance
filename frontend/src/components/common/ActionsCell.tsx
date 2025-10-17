'use client';
import { Edit2, Shield, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = {
  onEdit?: () => void;
  onPermissions?: () => void;
  onDelete?: () => void;
  compact?: boolean;
};

export default function ActionsCell({ onEdit, onPermissions, onDelete, compact }: Props) {
  const t = useTranslations('Common.Actions');
  const base = 'p-2 rounded-lg ring-1 ring-inset transition-colors';
  const small = compact ? ' p-1.5 ' : '';
  return (
    <div className="flex items-center justify-center gap-2">
      {onEdit && (
        <button onClick={onEdit} className={`${base} ${small} bg-blue-50 ring-blue-200 hover:bg-blue-100`} title={t('edit')}>
          <Edit2 className="w-4 h-4 text-blue-700" />
        </button>
      )}
      {onPermissions && (
        <button onClick={onPermissions} className={`${base} ${small} bg-purple-50 ring-purple-200 hover:bg-purple-100`} title={t('permissions')}>
          <Shield className="w-4 h-4 text-purple-700" />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className={`${base} ${small} bg-red-50 ring-red-200 hover:bg-red-100`} title={t('delete')}>
          <Trash2 className="w-4 h-4 text-red-700" />
        </button>
      )}
    </div>
  );
}
