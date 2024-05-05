import { defineStore } from "pinia";

export const useBBStore = defineStore("bbStore", {
  state: () =>
    ({
      ForumsUpvotesPost: [],
      ForumsDownvotesPost: [],
      ForumsUpvotesComment: [],
      ForumsDownvotesComment: [],
    }) as {
      ForumsUpvotesPost: number[];
      ForumsDownvotesPost: number[];
      ForumsUpvotesComment: number[];
      ForumsDownvotesComment: number[];
    },
  actions: {
    setForumsUpvotesPost(forumsUpvotesPost: number[]) {
      this.ForumsUpvotesPost = forumsUpvotesPost;
    },
    setForumsDownvotesPost(forumsDownvotesPost: number[]) {
      this.ForumsDownvotesPost = forumsDownvotesPost;
    },
    setForumsUpvotesComment(forumsUpvotesComment: number[]) {
      console.log(forumsUpvotesComment);
      this.ForumsUpvotesComment = forumsUpvotesComment;
    },
    setForumsDownvotesComment(forumsDownvotesComment: number[]) {
      this.ForumsDownvotesComment = forumsDownvotesComment;
    },
  },
});
