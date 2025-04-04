import {
  PROVIDER as PROVIDER_R2,
  listObjectsV2 as listObjectsV2_r2,
  getObject as getObject_r2,
  putObject as putObject_r2,
  deleteObject as deleteObject_r2,
  deleteObjects as deleteObjects_r2,
} from "./r2";

import {
  PROVIDER as PROVIDER_S3,
  listObjectsV2 as listObjectsV2_s3,
  getObject as getObject_s3,
  putObject as putObject_s3,
  deleteObject as deleteObject_s3,
  deleteObjects as deleteObjects_s3,
} from "./s3";

/*
import {
  PROVIDER as PROVIDER_GCS,
  listObjectsV2 as listObjectsV2_gcs,
  getObject as getObject_gcs,
  putObject as putObject_gcs,
  deleteObject as deleteObject_gcs,
  deleteObjects as deleteObjects_gcs,
} from "./gcs";
*/

const DEFAULT_PROVIDER = PROVIDER_R2;

export const listObjectsV2 = async (args) => {
  const provider = args?.provider || DEFAULT_PROVIDER;
  switch (provider) {
    case PROVIDER_R2:
      return listObjectsV2_r2(args);
    case PROVIDER_S3:
      return listObjectsV2_s3(args);
    //case PROVIDER_GCS:
    //return listObjectsV2_gcs(args);
    default:
      throw new Error("Invalid Provider");
  }
};

export const getObject = async (args) => {
  const provider = args?.provider || DEFAULT_PROVIDER;
  switch (provider) {
    case PROVIDER_R2:
      return getObject_r2(args);
    case PROVIDER_S3:
      return getObject_s3(args);
    //case PROVIDER_GCS:
    //return getObject_gcs(args);
    default:
      throw new Error("Invalid Provider");
  }
};

export const putObject = async (args) => {
  const provider = args?.provider || DEFAULT_PROVIDER;
  switch (provider) {
    case PROVIDER_R2:
      return putObject_r2(args);
    case PROVIDER_S3:
      return putObject_s3(args);
    //case PROVIDER_GCS:
    //return putObject_gcs(args);
    default:
      throw new Error("Invalid Provider");
  }
};

export const deleteObject = async (args) => {
  const provider = args?.provider || DEFAULT_PROVIDER;
  switch (provider) {
    case PROVIDER_R2:
      return deleteObject_r2(args);
    case PROVIDER_S3:
      return deleteObject_s3(args);
    //case PROVIDER_GCS:
    //return deleteObject_gcs(args);
    default:
      throw new Error("Invalid Provider");
  }
};

export const deleteObjects = async (args) => {
  const provider = args?.provider || DEFAULT_PROVIDER;
  switch (provider) {
    case PROVIDER_R2:
      return deleteObjects_r2(args);
    case PROVIDER_S3:
      return deleteObjects_s3(args);
    //case PROVIDER_GCS:
    //return deleteObjects_gcs(args);
    default:
      throw new Error("Invalid Provider");
  }
};
