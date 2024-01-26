import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  credentials = {
    email: '',
    password: ''
  }

  showAlert: boolean = false;
  alertMsg: string = 'Please wait!';
  alertColor: string = 'blue';
  inSubmission: boolean = false;

  constructor(private auth: AngularFireAuth) {

  }

  async login() {
    this.showAlert = true;
    this.alertMsg = "Please wait!";
    this.alertColor = "blue";
    this.inSubmission = true;

    try {
      await this.auth.signInWithEmailAndPassword(
        this.credentials.email as string, this.credentials.password as string
      )
      this.alertMsg = "Success. Logged in.";
      this.alertColor = "green";
    } catch (error) {
      this.alertMsg = "Unexpected error occured. Please try again.";
      this.alertColor = "red";
      this.inSubmission = false;
      return 
    }
  }

}
