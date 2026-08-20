// Minimal ambient types for the WebOTP API (Chromium/Android). These are not
// in the standard TS DOM lib. Declaration-merged into the global scope.

type OTPCredentialTransportType = "sms"

interface OTPCredentialRequestOptions {
  transport?: OTPCredentialTransportType[]
}

interface OTPCredential extends Credential {
  readonly code: string
}

interface CredentialRequestOptions {
  otp?: OTPCredentialRequestOptions
}
