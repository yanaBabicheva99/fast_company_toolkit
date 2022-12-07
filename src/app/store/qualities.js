import { createSlice } from "@reduxjs/toolkit";
import qualityService from "../services/quality.service";
import { isOutdated } from "../utils/isOutdated";

const qualitiesSlice = createSlice({
  name: "qualities",
  initialState: {
    entities: null,
    isLoading: true,
    errors: null,
    lastFetch: null
  },
  reducers: {
    qualitiesRequested: (state) => {
      state.isLoading = true;
    },
    qualitiesReceived: (state, action) => {
      state.entities = action.payload;
      state.lastFetch = Date.now();
      state.isLoading = false;
    },
    qualitiesRequestFiled: (state, action) => {
      state.errors = action.payload;
      state.isLoading = false;
    }
  }
});

const { reducer: qualitiesReducer, actions } = qualitiesSlice;
const { qualitiesRequested, qualitiesReceived, qualitiesRequestFiled } = actions;

export const loadQualitiesList = () => async (dispatch, getState) => {
  const { lastFetch } = getState().qualities;
  if (isOutdated(lastFetch)) {
    dispatch(qualitiesRequested());
    try {
      const { content } = await qualityService.fetchAll();
      dispatch(qualitiesReceived(content));
    } catch (err) {
      dispatch(qualitiesRequestFiled(err.message));
    }
  }
};
export const getQualities = () => (state) => {
  return state.qualities.entities;
};
export const getQualitiesLoadingStatus = () => (state) => {
  return state.qualities.isLoading;
};

export const getQualitiesByIds = (qualitiesIds) => (state) => {
  if (state.qualities.entities) {
    const qualitiesArray = [];
    for (const qualId of qualitiesIds) {
      for (const qual of state.qualities.entities) {
        if (qualId === qual._id) {
          qualitiesArray.push(qual);
          break;
        }
      }
    }
    return qualitiesArray;
  }
  return [];
};

export default qualitiesReducer;
