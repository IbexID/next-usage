/* eslint-disable react-hooks/exhaustive-deps */
import {
  IEnglWord,
  IEnglishBookWithWordList,
  assignUserToTextId,
  fetchEnglishBookBySlug,
} from '@slonum/kit';
import { useAppDispatch, useAppSelector } from '@ui/redux';
import { englishActions } from 'lib/entities/English/model';
import { englishListActions } from 'lib/entities/EnglishList/model';
import { BookListPage } from 'lib/pages/BookListPage';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

const BooksListIndex = (props: { book: IEnglishBookWithWordList }) => {
  const router = useRouter();
  const isStudiedWordsActive = useAppSelector(
    (state) => state.english.isStudiedWordsActive,
  );
  const isPrepositionsActive = useAppSelector(
    (state) => state.english.isPrepositionsActive,
  );
  const shownCount = useAppSelector((state) => state.english.shownCount);
  const isAuth = useAppSelector((state) => !!state.auth.tokens);
  const wordData = useAppSelector((state) => state.english.wordsData);
  const page = useAppSelector((state) => state.english.page);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(englishActions.clear());
    dispatch(englishListActions.setIsBookLoading(false));
    dispatch(englishActions.setUniqueWordCount(props.book.wordsCount));
    if (props.book.wordList) {
      dispatch(englishActions.setWordsData(props.book.wordList));
    }
  }, []);

  useEffect(() => {
    if (wordData && page !== 1) {
      const fetchPageWords = async () => {
        await fetchEnglishBookBySlug(
          props.book.slug,
          page,
          100,
          isStudiedWordsActive,
          !isPrepositionsActive,
        )
          .then(({ wordList }) => {
            const filtered = wordList;
            dispatch(
              englishActions.setWordsData([
                ...(wordData as IEnglWord[]),
                ...filtered,
              ]),
            );

            dispatch(englishActions.setLoading(false));
          })
          .catch((e) => {
            console.log(e);
            dispatch(englishActions.setLoading(false));
          });
      };

      dispatch(englishActions.setLoading(true));
      fetchPageWords();
    }
  }, [page]);

  useEffect(() => {
    (async () => {
      if (isAuth) {
        try {
          await assignUserToTextId(props.book.textId);
        } catch (e) {
          console.log(e);
        }
      }
    })();
  }, []);

  useEffect(() => {
    const getBookListOnLoad = async () => {
      const limit = shownCount === 10 ? 100 : shownCount;
      try {
        await fetchEnglishBookBySlug(
          props.book.slug,
          1,
          limit,
          isStudiedWordsActive,
          !isPrepositionsActive,
        )
          .then(({ wordList, wordsCount }) => {
            dispatch(englishActions.setUniqueWordCount(wordsCount));
            dispatch(englishActions.setWordsData(wordList));
          })
          .catch((e) => {
            console.log(e);
            dispatch(englishActions.setLoading(false));
          });
      } catch {
        dispatch(englishActions.setLoading(false));
      }
    };

    getBookListOnLoad();
  }, [props.book, isStudiedWordsActive, isPrepositionsActive]);

  function handleStart(url: string) {
    const check = url.split('/');
    if (check[1] !== 'lists') {
      dispatch(englishActions.clear());
      dispatch(englishListActions.clear());
    }
  }

  useEffect(() => {
    router.events.on('routeChangeStart', handleStart);
    return () => {
      router.events.off('routeChangeStart', handleStart);
    };
  }, [router]);

  return <BookListPage book={props.book} />;
};

export default BooksListIndex;

export async function getServerSideProps(context) {
  context.res.setHeader(
    'Cache-Control',
    'public, s-maxage=319264587, stale-while-revalidate=319264587',
  );
  const query = context.params.slug;
  const cookie = context.req.headers.cookie;
  const filter = {
    limit: 100,
    page: 1,
  };
  let book = null;
  try {
    book = await fetchEnglishBookBySlug(
      query,
      filter.page,
      undefined,
      undefined,
      undefined,
      cookie,
    );
  } catch {}

  return {
    props: { book: book || null },
  };
}
