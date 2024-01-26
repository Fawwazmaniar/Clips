import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { v4 as uuid } from 'uuid';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { switchMap } from 'rxjs';
import { ClipService } from 'src/app/services/clip.service';
import { Router } from '@angular/router';
import { FfmpegService } from 'src/app/services/ffmpeg.service';
import { combineLatest, forkJoin } from 'rxjs';


@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnDestroy {

  isDragover = false;
  file: File | null = null;
  nextStep = false;

  percentage = 0;
  showPercentage = false;
  thumbnail = new FormControl('', [
    Validators.required,
  ]);
  title = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
  ]);

  uploadForm = new FormGroup({
    title: this.title,
  })

  showAlert = false;
  alertColor = 'blue';
  inSubmission = false;
  alertMsg = 'please wait';
  user: firebase.User | null = null;
  task?: AngularFireUploadTask;
  screenshots: string[] = []
  selectedScreenshot = '';
  screenshotTask?: AngularFireUploadTask;

  constructor(private storage: AngularFireStorage,
    private auth: AngularFireAuth,
    private clipService: ClipService,
    public ffmpegService: FfmpegService,
    private router: Router) {
    auth.user.subscribe(user => this.user = user);
    this.ffmpegService.init();
  }

  ngOnDestroy(): void {
    this.task?.cancel();
  }

  async storeFile($event: Event) {
    if (this.ffmpegService.isRunning) {
      return
    }

    this.isDragover = false
    this.file = ($event as DragEvent).dataTransfer ? ($event as DragEvent).dataTransfer?.files.item(0) ?? null : ($event.target as HTMLInputElement).files?.item(0) ?? null;

    if (!this.file || this.file.type !== 'video/mp4') {
      return
    }
    this.screenshots = await this.ffmpegService.getScreenshots(this.file);
    this.selectedScreenshot = this.screenshots[0]
    this.nextStep = true;
    this.title.setValue(
      this.file.name.replace(/\.[^/.]+$/, '')
    )
  }

  async upload() {
    this.uploadForm.disable();
    this.showAlert = true;
    this.alertColor = 'blue';
    this.alertMsg = 'please wait';
    this.inSubmission = true;
    this.showPercentage = true;
    const clipFileName = uuid()
    const clipPath = `clips/${clipFileName}.mp4`;

    const screenshotBlob = await this.ffmpegService.blobFromURL(
      this.selectedScreenshot
    )

    const screenshotPath = `screenshots/${clipFileName}.png`;
    this.task = this.storage.upload(clipPath, this.file);
    const clipRef = this.storage.ref(clipPath);

    this.screenshotTask = this.storage.upload(screenshotPath, screenshotBlob);

    const screenshotRef = this.storage.ref(screenshotPath);

    combineLatest([
      this.task.percentageChanges(),
      this.screenshotTask.percentageChanges(),
    ]).subscribe((progress) => {
      const [clipProgress, screenshotProgres] = progress;

      if (!clipProgress || !screenshotProgres) {
        return
      }

      const total = clipProgress + screenshotProgres

      this.percentage = (total as number) / 200;
    })

    forkJoin([
      this.task.snapshotChanges(),
      this.screenshotTask.snapshotChanges()
    ]).pipe(
      switchMap(() => forkJoin([
        clipRef.getDownloadURL(),
        screenshotRef.getDownloadURL()
      ]))
    ).subscribe({
      next: async (urls) => {

        const [clipURL, screenshotURL] = urls;
        const clip = {
          uid: this.user?.uid as string,
          displayName: this.user?.displayName as string,
          title: this.title.value as string,
          fileName: `${clipFileName}.mp4`,
          url: clipURL,
          screenshotUrl: screenshotURL,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          screenshotFileName: `${clipFileName}.png`
        }

        const clipDocRef = await this.clipService.createClip(clip)
        this.alertColor = 'green';
        this.alertMsg = 'Upload Completed';
        this.showPercentage = false;

        setTimeout(() => {
          this.router.navigate([
            'clip', clipDocRef.id
          ])
        }, 1000);
      },
      error: (error) => {
        this.uploadForm.enable();
        this.alertColor = 'red';
        this.alertMsg = 'Upload failed';
        this.inSubmission = true;
        this.showPercentage = false;
        console.error(error)
      }
    })
  }

}
