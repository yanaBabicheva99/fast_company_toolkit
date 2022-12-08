import { createAction, createSlice } from "@reduxjs/toolkit";
import userService from "../services/user.service";
import authService from "../services/auth.service";
import localStorageService from "../services/localStorage.service";
import history from "../utils/history";
import { generateAuthError } from "../utils/generateAuthError";
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
const initialState = localStorageService.getAccessToken()
  ? {
    entities: null,
    isLoading: true,
    errors: null,
    auth: localStorageService.getUserId(),
    isLoggedIn: true,
    dataLoaded: false
  }
  : {
    entities: null,
    isLoading: false,
    errors: null,
    auth: null,
    isLoggedIn: null,
    dataLoaded: false
  };

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    usersRequested: (state) => {
      state.isLoading = true;
    },
    usersReceived: (state, action) => {
      state.entities = action.payload;
      state.isLoading = false;
      state.dataLoaded = true;
    },
    usersRequestFailed: (state, action) => {
      state.errors = action.payload;
      state.isLoading = false;
    },
    authRequestSuccess: (state, action) => {
      state.auth = action.payload;
      state.isLoggedIn = true;
    },
    authRequestFailed: (state, action) => {
      state.errors = action.payload;
    },
    userCreated: (state, action) => {
      if (!Array.isArray(state.entities)) {
        state.entities = [];
      }
      state.entities.push(action.payload);
    },
    userUpdated: (state, action) => {
      const userInd = state.entities.findIndex(el => el._id === state.auth);
      state.entities[userInd] = action.payload;
    },
    userLoggedOut: (state) => {
      state.entities = null;
      state.auth = null;
      state.isLoggedIn = null;
      state.dataLoaded = false;
    },
    authRequested: (state) => {
      state.errors = null;
    }
  }
});

const { reducer: usersReducer, actions } = usersSlice;
const {
  usersRequested,
  usersReceived,
  usersRequestFailed,
  authRequestSuccess,
  authRequestFailed,
  userCreated,
  userUpdated,
  userLoggedOut
} = actions;

const authRequested = createAction("users/authRequested");
const userCreateRequested = createAction("users/createRequested");
const createUserFailed = createAction("users/createUserFailed");
const getUserFailed = createAction("users/getUserFailed");
const userUpdateRequested = createAction("users/updateRequested");

export const getUser = () => async (dispatch) => {
  try {
    const { content } = await userService.getCurrentUser();
    console.log(content);
  } catch (err) {
    dispatch(getUserFailed());
  }
};

const createUser = (payload) => async (dispatch) => {
  dispatch(userCreateRequested());
  try {
    const { content } = await userService.create(payload);
    dispatch(userCreated(content));
    history.push("/users");
  } catch (err) {
    dispatch(createUserFailed(err.message));
  }
};

export const login = ({ payload, redirect }) => {
  const { email, password } = payload;
  return async (dispatch) => {
    dispatch(authRequested());
    try {
      const data = await authService.login({ email, password });
      localStorageService.setTokens(data);
      dispatch(authRequestSuccess(data.localId));
      history.push(redirect);
      dispatch(getUser());
    } catch (err) {
      const { code, message } = err.response.data.error;
      if (code === 400) {
        const errMessage = generateAuthError(message);
        dispatch(authRequestFailed(errMessage));
      } else {
        dispatch(authRequestFailed(err.message));
      }
    }
  };
};

export const signUp = ({ email, password, ...rest }) => async (dispatch) => {
  dispatch(authRequested());
  try {
    const data = await authService.register({ email, password });
    localStorageService.setTokens(data);
    dispatch(authRequestSuccess({ userId: data.localId }));

    dispatch(createUser({
      _id: data.localId,
      email,
      rate: randomInt(1, 5),
      completedMeetings: randomInt(0, 200),
      image: `https://avatars.dicebear.com/api/avataaars/${(
        Math.random() + 1
      )
        .toString(36)
        .substring(7)}.svg`,
      ...rest
    }));
  } catch (err) {
    dispatch(authRequestFailed(err.message));
  }
};

export const updateUserData = (data) => async (dispatch) => {
  dispatch(userUpdateRequested());
  try {
    const { content } = await userService.update(data);
    dispatch(userUpdated(content));
  } catch (err) {
    dispatch(authRequestFailed(err.message));
  }
};

export const loadUsersList = () => async (dispatch) => {
  dispatch(usersRequested());
  try {
    const { content } = await userService.get();
    dispatch(usersReceived(content));
  } catch (err) {
    dispatch(usersRequestFailed(err.message));
  }
};
export const getUsersList = () => (state) => {
  return state.users.entities;
};
export const getUserById = (id) => (state) => {
  if (state.users.entities) {
    return state.users.entities.find(user => user._id === id);
  }
};

export const getCurrentUser = () => (state) => {
  return state.users.entities
    ? state.users.entities.find(u => u._id === state.users.auth)
    : null;
};

export const logOut = () => (dispatch) => {
  localStorageService.removeAuthData();
  dispatch(userLoggedOut());
  history.push("/");
};

export const getIsLoggedIn = () => (state) => {
  return state.users.isLoggedIn;
};

export const getDataStatus = () => (state) => {
  return state.users.dataLoaded;
};
export const getCurrentUserId = () => (state) => {
  return state.users.auth;
};

export const getUsersLoadingStatus = () => (state) => {
  return state.users.isLoading;
};

export const getAuthError = () => (state) => {
  return state.users.errors;
};

export default usersReducer;
