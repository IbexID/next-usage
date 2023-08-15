import { wrapper } from 'lib/app/store';
import { setGradeFilter } from 'lib/entities/Grade/model';
import { setMetaData } from 'lib/entities/Home/model/MetaData/slice';
import { vocabularyData } from 'lib/entities/Home/model';
import { wordsStore } from 'lib/entities/Words';
import { Home } from 'lib/pages/Home';
import { useAppSelector } from '@ui/redux';
import { insertClassText } from 'lib/shared/lib/utils/insertClassText';
import Head from 'next/head';

interface IIndexProps {
  id: number;
}

export default function IndexHome({ id }: IIndexProps) {
  const metaData = useAppSelector((store) => store.metaData);
  const meta = metaData.meta;
  const title = meta ? insertClassText(meta.title, id) : '';
  const description = meta ? insertClassText(meta.description, id) : '';

  return (
    <>
      <Head>
        <title>{title.toString()}</title>
        <meta name="description" content={description} />
      </Head>
      <Home id={id} />
    </>
  );
}

export const getServerSideProps = wrapper.getServerSideProps(
  (store) => async (ctx) => {
    ctx.res.setHeader(
      'Cache-Control',
      'public, s-maxage=10, stale-while-revalidate=59',
    );
    const id = ctx.params ? ctx.params.id : undefined;
    if (id && typeof id === 'string') {
      const grade: number = +id.split('-')[0];
      if (grade && !isNaN(+grade) && grade > 0 && grade < 12) {
        await store.dispatch(setMetaData(vocabularyData));
        await store.dispatch(setGradeFilter(+grade === 11 ? 10 : +grade));
        await store.dispatch(wordsStore.actions.setWordsCount());
        return {
          props: { id: +grade },
        };
      }
    }

    if (id) {
      return {
        redirect: {
          destination: '/class',
          permanent: false,
        },
        props: { id: 0 },
      };
    }

    return {
      props: { id: 0 },
    };
  },
);
