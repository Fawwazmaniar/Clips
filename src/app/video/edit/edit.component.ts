import { Component, OnInit, OnDestroy, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';
import IClip from 'src/app/models/clip.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ClipService } from 'src/app/services/clip.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit, OnDestroy, OnChanges {

  @Input() activeClip: IClip | null = null;
  @Output() update = new EventEmitter();
  title = new FormControl('', {
    validators: [
      Validators.required,
      Validators.minLength(3)
    ],
    nonNullable: true
  });

  clipID = new FormControl('', {
    nonNullable: true
  });

  editForm = new FormGroup({
    title: this.title,
    id: this.clipID
  })

  showAlert = false;
  alertColor = 'blue';
  alertMsg = 'please wait';
  inSubmission = false;

  constructor(private modal: ModalService, private clips: ClipService) {

  }

  ngOnInit(): void {
    this.modal.register('editClip')
  }

  ngOnDestroy(): void {
    this.modal.unregister('editClip')
  }

  ngOnChanges(): void {
    if (!this.activeClip) {
      return
    }
    this.clipID.setValue(this.activeClip.docID as string);
    this.title.setValue(this.activeClip.title);
    this.showAlert = false;
    this.inSubmission = false;

  }

  async submit() {
    if (!this.activeClip) {
      return
    }
    this.showAlert = true;
    this.alertColor = 'blue';
    this.alertMsg = 'please wait';
    this.inSubmission = true;
    try {
      await this.clips.updateClip(
        this.clipID.value, this.title.value
      )
    } catch (error) {
      this.inSubmission = false;
      this.alertColor = 'red';
      this.alertMsg = 'Something Wrong';
      console.log(error)
      return
    }

    this.activeClip.title = this.title.value;
    this.update.emit(this.activeClip);
    this.inSubmission = false;
    this.alertColor = 'green';
    this.alertMsg = 'Success';
  }
}
