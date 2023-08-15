/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@ui/redux";
import { IEnglishTop, getTopList } from "@slonum/kit";
import { englishActions } from "lib/entities/English/model";
import { TopPage } from "lib/pages/TopPage";
import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";

const TOPS: number[] = [100, 300, 500, 1000, 1500, 2000, 3000, 5000, 10000];

const Top = ({ list, metaContent, title }) => {
  const router = useRouter();
  const [metaData, setMetadata] = useState({ title, metaContent });
  const [topList, setTopList] = useState<IEnglishTop>(list);
  const page = useAppSelector((state) => state.english.page);
  const top = +(router.query.top as string);
  const excludeAmount = useAppSelector(
    (state) => state.english.previousTopState
  );
  const excludePreviousTop = useAppSelector(
    (state) => state.english.excludePreviousTop
  );
  const exclude = excludePreviousTop ? excludeAmount : 0;
  const hidePrepositions = useAppSelector(
    (state) => !state.english.isPrepositionsActive
  );
  const hide = useAppSelector((state) => state.english.isStudiedWordsActive)
    ? "studied"
    : undefined;
  const dispatch = useAppDispatch();

  function getPreviousTop(top: number) {
    TOPS.map((tops: number, index) => {
      if (top === TOPS[index]) {
        dispatch(englishActions.setPreviousTopState(TOPS[index - 1]));
        return;
      } else return 0;
    });
  }

  useEffect(() => {
    getPreviousTop(top);
  }, [top]);

  useEffect(() => {
    if (excludePreviousTop)
      dispatch(englishActions.setUniqueWordCount(top - exclude));
    else dispatch(englishActions.setUniqueWordCount(top));
  }, [top, exclude, excludePreviousTop]);

  useEffect(() => {
    if (top > 0) {
      (async () => {
        try {
          const list = await getTopList({
            take: top,
            exclude,
            hidePrepositions,
            hide,
            page,
          });
          setTopList(list);
        } catch (e) {
          console.log(e);
        }
      })();
    }
  }, [page, top, hidePrepositions, hide]);

  useEffect(() => {
    setMetadata({
      title: `Топ-${top} слов - Английский язык - СлонУм`,
      metaContent: `Подборка топ-${top} слов в английском языке`,
    });
  }, [top]);

  useEffect(() => {
    if (top > 0) {
      dispatch(englishActions.setPage(1));
      (async () => {
        try {
          const list = await getTopList({
            take: top,
            exclude,
            hidePrepositions,
            hide,
            page,
          });
          setTopList(list);
        } catch (e) {
          console.log(e);
        }
      })();
    }
  }, [exclude]);

  return (
    <>
      <Head>
        <meta name="description" content={metaData.metaContent}></meta>
        <title>{metaData.title}</title>
      </Head>
      <TopPage list={topList} top={top} />
    </>
  );
};

export default Top;

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: TOPS.map((top) => `/top/${top}`),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const top = +(context.params.top as string);
  const list = await getTopList({
    take: top,
    exclude: 0,
    hidePrepositions: false,
    page: 1,
  });
  const metaContent = `Подборка топ-${top} слов в английском языке`;
  const title = `Топ-${top} слов - Английский язык - СлонУм`;
  return { props: { list, metaContent, title } };
};
