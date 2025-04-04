import { EntityConstants } from "../../constants";

export const getEmailPK = ({ email }) => `${EntityConstants.EMAIL}#${email}`;
export const getUserPK = ({ id }) => `${EntityConstants.USER}#${id}`;
export const getUserAbacPK = ({ id, entity }) => `${EntityConstants.USER}#${id}#${entity}`;
export const getCodePK = ({ code }) => `${EntityConstants.CODE}#${code}`;
export const getKeyPK = ({ key }) => `${EntityConstants.KEY}#${key}`;

// NOTE: let this fail if entity undefined
export const parseEntityId = ({ entity, pk }) => pk.split(`${entity}#`)[1];
