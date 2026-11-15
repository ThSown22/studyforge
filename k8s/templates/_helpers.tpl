{{- define "studyforge.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "studyforge.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "studyforge.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "studyforge.selectorLabels" -}}
app.kubernetes.io/name: {{ include "studyforge.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "studyforge.labels" -}}
helm.sh/chart: {{ include "studyforge.chart" . }}
{{ include "studyforge.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "studyforge.frontendName" -}}
{{- printf "%s-frontend" (include "studyforge.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "studyforge.backendName" -}}
{{- printf "%s-backend" (include "studyforge.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
