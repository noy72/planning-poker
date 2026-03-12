resource "google_artifact_registry_repository" "planning_poker" {
  repository_id = "planning-poker"
  location      = var.region
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}