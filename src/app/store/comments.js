import { createAction, createSlice } from "@reduxjs/toolkit";
import commentService from "../services/comment.service";

const commentsSlice = createSlice({
  name: "comments",
  initialState: {
    entities: null,
    isLoading: true,
    errors: null
  },
  reducers: {
    commentsRequested: (state) => {
      state.isLoading = true;
    },
    commentsReceived: (state, action) => {
      state.entities = action.payload;
      state.isLoading = false;
    },
    commentsRequestFailed: (state, action) => {
      state.errors = action.payload;
      state.isLoading = false;
    },
    commentCreated: (state, action) => {
      state.entities.push(action.payload);
    },
    commentFailed: (state, action) => {
      state.errors = action.payload;
    },
    commentDeleted: (state, action) => {
      state.entities = state.entities.filter(com => com._id !== action.payload);
    }
  }
});

const { reducer: commentsReducer, actions } = commentsSlice;
const { commentsRequested, commentsReceived, commentsRequestFailed, commentCreated, commentFailed, commentDeleted } = actions;

const commentCreateRequested = createAction("comments/createRequested");
const commentDeleteRequested = createAction("comments/deleteRequested");

export const loadCommentsList = (id) => async (dispatch) => {
    dispatch(commentsRequested());
    try {
      const { content } = await commentService.getComments(id);
      dispatch(commentsReceived(content));
    } catch (err) {
      dispatch(commentsRequestFailed(err.message));
    }
};

export const createComment = (data) => async (dispatch) => {
  dispatch(commentCreateRequested());
  try {
    const { content } = await commentService.createComment(data);
    dispatch(commentCreated(content));
  } catch (err) {
    dispatch(commentFailed(err.message));
  }
};

export const removeComment = (id) => async (dispatch) => {
  dispatch(commentDeleteRequested());
  try {
    const { content } = await commentService.removeComment(id);
    if (content === null) {
      dispatch(commentDeleted(id));
    } else {
      dispatch(commentDeleted(content._id));
    }
    dispatch(commentDeleted(id));
  } catch (err) {
    dispatch(commentFailed(err.message));
  }
};

export const getCommentsList = () => (state) => {
  return state.comments.entities;
};

export const getCommentsLoadingStatus = () => (state) => {
  return state.comments.isLoading;
};

export default commentsReducer;
