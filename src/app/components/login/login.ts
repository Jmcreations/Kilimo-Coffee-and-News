import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterLink], // Removed FormsModule since there are no longer inputs
  templateUrl: './login.html',
  standalone: true,
  styleUrl: './login.scss',
})
export class Login {

  handleGoogleLogin() {
    console.log('Attempting Google OAuth login...');
    // Future Google SSO logic goes here
  }

  handleMicrosoftLogin() {
    console.log('Attempting Microsoft OAuth login...');
    // Future Microsoft SSO logic goes here
  }
}