import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Dashboard',
  });

  return {
    title: t('meta_title'),
<<<<<<< HEAD
    description: t('meta_description'),
  };
}

export default async function Dashboard(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Dashboard' });

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">{t('heading')}</h1>
        <p className="mt-2 text-sm text-gray-600">{t('subheading')}</p>
      </div>
=======
  };
}

export default function Dashboard() {
  return (
    <div className="flex py-5 [&_p]:my-6 justify-center">
      Dashboard
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
    </div>
  );
}