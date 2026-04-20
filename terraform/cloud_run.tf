resource "google_service_account" "cloud_run" {
  account_id   = "planning-poker-run"
  display_name = "Planning Poker Cloud Run SA"
}

resource "google_project_iam_member" "firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}
