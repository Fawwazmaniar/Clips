import firebase from 'firebase/compat/app';

export default interface IClip {
  uid: string,
  displayName: string,
  title: string,
  fileName: string,
  timestamp: firebase.firestore.FieldValue,
  docID?: string,
  url: string;

  screenshotUrl?: string;
  screenshotFileName: string;
}