# StudyForge GitOps

Repository này lưu desired state dùng để triển khai StudyForge lên Kubernetes On-Premise. Argo CD theo dõi repository, cài CloudNativePG, tạo PostgreSQL cluster và render Helm Chart của ứng dụng.

- **Application:** [StudyForge](https://studyforge.thsown.me)
- **Source repository:** [studyforge-app](http://gitlab.thsown.com/thsown_group/studyforge-app)

`studyforge-gitops` không chứa application source hoặc container build logic. CI nằm trong `studyforge-app`; repository này chịu trách nhiệm cho CD, infrastructure manifests và vận hành Kubernetes.

## Kiến trúc triển khai

```text
Developer push
     │
     ▼
GitLab CI ── validate/build/verify ──► Harbor
     │                                  frontend:<commit-SHA>
     │                                  backend:<commit-SHA>
     └── update image tags
                 │
                 ▼
        studyforge-gitops
                 │
                 ▼
             Argo CD
                 │
        ┌────────┴───────────┐
        ▼                    ▼
CloudNativePG Operator   StudyForge Helm release
        │                migration/backend/frontend
        ▼
Cluster/studyforge-postgres
        │
        ├── PostgreSQL Pod
        └── PVC ── Longhorn CSI ──► PersistentVolume
```

Môi trường triển khai hiện tại là Kubernetes `v1.30.14` gồm ba control-plane node (`master1`–`master3`) và ba worker node (`worker1`–`worker3`). Application workloads, PostgreSQL Pod và Longhorn volumes được Kubernetes cùng các controller liên quan phân bổ trên worker nodes.

Public request path:

```text
Internet
   │
   ▼
Cloudflare Edge
   │
   ▼
Cloudflare Tunnel
   │ HTTPS
   ▼
NGINX Ingress Controller
   │
   ▼
Frontend Service ── /api ──► Backend Service
                                      │
                                      ▼
                           CloudNativePG PostgreSQL
```

Cloudflare Tunnel publish hostname `studyforge.thsown.me` và chuyển traffic tới NGINX Ingress qua HTTPS. Route Cloudflare được quản lý trong Cloudflare Zero Trust, không nằm trong repository này.

Cloudflare Tunnel không phải điều kiện để bootstrap các workload Kubernetes. Published hostname được cấu hình sau khi Ingress và các service nội bộ đã hoạt động; nó chỉ cung cấp đường truy cập công khai cho hệ thống.

## App-of-Apps

`application.yaml` là root Argo CD Application. Root application theo dõi thư mục `applications/` và quản lý các child resources sau:

| Wave | Resource | Trách nhiệm |
| ---: | --- | --- |
| `-30` | `AppProject/studyforge` | Giới hạn source repository và deployment destination |
| `-20` | `cloudnative-pg` | Cài CloudNativePG operator và CRDs từ official Helm repository |
| `-10` | `studyforge-database` | Tạo `Cluster/studyforge-postgres` |
| `0` | `studyforge-app` | Render Helm Chart và triển khai workload ứng dụng |

Sync waves thể hiện dependency order khi root application reconcile child resources. Từng child Application vẫn có automated sync, retry và self-heal policy riêng.

Argo CD không mặc định tổng hợp health của `Application` custom resource. Để root App-of-Apps có thể chờ và phản ánh health của các child Applications theo sync wave, Argo CD platform cần cấu hình custom health assessment cho `argoproj.io/Application` trong `argocd-cm`. Cấu hình cấp platform này nằm ngoài repository StudyForge.

## Cấu trúc repository

```text
studyforge-gitops/
├── application.yaml
├── applications/
│   ├── studyforge-project.yaml
│   ├── cloudnative-pg-operator-crds.yaml
│   ├── studyforge-postgresql-cluster.yaml
│   └── studyforge-web-workloads.yaml
├── infrastructure/
│   └── postgresql/
│       └── cluster.yaml
└── k8s/
    ├── Chart.yaml
    ├── values.yaml
    └── templates/
        ├── _helpers.tpl
        ├── migration-job.yaml
        ├── frontend-deployment.yaml
        ├── frontend-service.yaml
        ├── backend-deployment.yaml
        ├── backend-service.yaml
        └── ingress.yaml
```

## Kubernetes workloads

### PostgreSQL

CloudNativePG quản lý PostgreSQL 17 dưới dạng một `Cluster` custom resource:

- `instances: 1` phù hợp với giới hạn tài nguyên của lab.
- PersistentVolume sử dụng StorageClass `longhorn` với dung lượng `5Gi`.
- CNPG tạo service `studyforge-postgres-rw` và application credentials secret `studyforge-postgres-app`.
- Database resource có `Prune=false,Delete=false` để tránh bị xóa tự động cùng Application.

### StudyForge Helm Chart

Helm Chart triển khai:

- Kubernetes migration Job được đánh dấu là Argo CD `PreSync` hook trong Helm template.
- Frontend Deployment và ClusterIP Service.
- Backend Deployment và ClusterIP Service.
- NGINX Ingress cho `studyforge.thsown.me`.

Frontend và backend image dùng full commit-SHA tag. `studyforge-app` pipeline cập nhật đồng thời repository và tag trong `k8s/values.yaml`; Argo CD không theo dõi tag mutable như `latest`.

Migration phải hoàn tất trước khi Argo CD tạo hoặc cập nhật application workloads.

## Networking và TLS

- Ingress class: `nginx`.
- Public hostname: `studyforge.thsown.me`.
- cert-manager ClusterIssuer: `letsencrypt`.
- Kubernetes TLS secret: `studyforge-tls`.
- Cloudflare Tunnel chuyển HTTPS traffic từ Cloudflare Edge tới NGINX Ingress endpoint nội bộ.

`studyforge-tls` do cert-manager tạo từ Ingress declaration. Secret này không được tạo hoặc commit thủ công trong repository.

## Secrets cần chuẩn bị

Repository chỉ tham chiếu tên secret; không lưu credential values.

| Secret | Nguồn | Mục đích |
| --- | --- | --- |
| `studyforge-harbor` | Tạo ngoài Git | Pull private images từ Harbor |
| `studyforge-backend` | Tạo ngoài Git | Merriam-Webster và DeepL API keys |
| `studyforge-postgres-app` | CloudNativePG | PostgreSQL username/password |
| `studyforge-tls` | cert-manager | TLS certificate cho public hostname |

Hai secret `studyforge-harbor` và `studyforge-backend` phải được tạo bằng quy trình quản lý secret của môi trường trước khi ứng dụng sync. README không cung cấp lệnh chứa credential trực tiếp để tránh đưa giá trị nhạy cảm vào source, shell history hoặc process arguments.

## Bootstrap

Yêu cầu trước khi bootstrap:

- Argo CD đã được cài và truy cập được repository qua SSH.
- NGINX Ingress Controller đã hoạt động.
- Longhorn cung cấp StorageClass `longhorn`.
- cert-manager có ClusterIssuer tên `letsencrypt`.
- Hai secret bên ngoài đã được tạo trong namespace `studyforge`.
- `studyforge-app` pipeline đã publish image và ghi commit-SHA tag hợp lệ vào `k8s/values.yaml`.

Tạo root application:

```bash
kubectl apply -f application.yaml
```

Không cần apply lần lượt từng file trong `applications/`; root application sẽ reconcile toàn bộ child Applications.

Theo dõi:

```bash
kubectl -n argocd get applications
kubectl -n cnpg-system get pods
kubectl -n studyforge get clusters.postgresql.cnpg.io
kubectl -n studyforge get pods,jobs,services,ingress
```

Trạng thái mong đợi:

- `cloudnative-pg`: `Synced / Healthy`.
- `studyforge-database`: `Synced / Healthy`.
- `studyforge-app`: `Synced / Healthy`.
- PostgreSQL, backend và frontend pod: `Running` và ready.
- Migration Job: `Completed` hoặc được xóa sau khi hook thành công.

## Delivery flow

```text
1. Push code vào studyforge-app
2. GitLab CI validate source
3. Build và push frontend/backend image lên Harbor
4. Pull lại image và smoke test runtime
5. Commit image SHA vào k8s/values.yaml
6. Argo CD phát hiện Git change
7. Migration hook chạy
8. Backend và frontend rollout
```

Harbor push không tự triển khai ứng dụng. Deployment chỉ bắt đầu sau khi desired state trong repository này thay đổi.

## Vận hành

Kiểm tra rollout:

```bash
kubectl -n studyforge get pods -w
kubectl -n studyforge rollout status deployment/studyforge-backend
kubectl -n studyforge rollout status deployment/studyforge-frontend
```

Kiểm tra migration:

```bash
kubectl -n studyforge get jobs
kubectl -n studyforge logs job/studyforge-migration  # Chỉ khi Job vẫn còn tồn tại
```

Migration hook dùng policy `HookSucceeded`, vì vậy Argo CD xóa Job sau một sync thành công. Kết quả của lần chạy vẫn có thể kiểm tra trong Sync History của `studyforge-app`; raw container logs chỉ còn khả dụng nếu Job chưa bị xóa hoặc cluster đã có hệ thống lưu log tập trung.

Kiểm tra database:

```bash
kubectl -n studyforge get cluster studyforge-postgres
kubectl -n studyforge get pvc
```

Nếu Argo CD giữ một sync operation cũ tại migration hook, mở `studyforge-app`, chọn trạng thái `Syncing`, terminate operation cũ rồi refresh/sync revision mới. Chỉ thực hiện sau khi xác nhận migration pod cũ đã lỗi và GitOps revision mới chứa bản sửa.

## Rollback

Rollback ứng dụng được thực hiện bằng cách revert commit GitOps đã thay đổi frontend/backend image tag, sau đó để Argo CD reconcile về các commit-SHA tag trước đó. Không đổi trực tiếp Deployment trong cluster và không dùng lại tag `latest`, vì các thay đổi đó sẽ lệch khỏi desired state trong Git.

Rollback application image không tự đảo ngược database migration. Migration cần tương thích với cả phiên bản ứng dụng cũ và mới trong thời gian rollout; thay đổi schema không tương thích phải có corrective migration hoặc phương án khôi phục database đã được kiểm thử.

## Troubleshooting

| Hiện tượng | Kiểm tra đầu tiên |
| --- | --- |
| `ImagePullBackOff` | Kiểm tra Pod events, secret `studyforge-harbor`, Harbor repository và commit-SHA tag trong `k8s/values.yaml`. |
| Migration hook thất bại | Kiểm tra migration Pod/Job logs khi resource còn tồn tại, PostgreSQL readiness và secret `studyforge-postgres-app`. |
| PostgreSQL chưa `Ready` | Kiểm tra `Cluster/studyforge-postgres`, CloudNativePG operator, PVC và trạng thái Longhorn volume. |
| Argo CD repo-server báo connection refused | Kiểm tra repo-server Pod, restart count, Service selector và EndpointSlice trước khi sync lại. |
| Application `OutOfSync` hoặc `Missing` | Kiểm tra target revision, Sync History, manifest render và resource events; không sửa trực tiếp workload do Argo CD quản lý. |
| Website trả `502` hoặc Cloudflare không truy cập được | Kiểm tra Ingress, Service và Endpoints nội bộ trước; chỉ kiểm tra Tunnel route sau khi đường nội bộ đã hoạt động. |

## Phạm vi và giới hạn hiện tại

- Kubernetes cluster hiện chạy phiên bản `v1.30.14`.
- CloudNativePG Helm chart `0.29.1` triển khai operator `1.30.1` như một compatibility exception đã được kiểm thử trong lab nhưng không nằm trong phạm vi hỗ trợ chính thức cho Kubernetes `1.30`.
- PostgreSQL dùng một instance nên không cung cấp database high availability.
- Database backup automation và disaster recovery chưa nằm trong phạm vi hiện tại.
- Cloudflare Tunnel routes và secret values được quản lý ngoài GitOps repository.

Các giới hạn trên được ghi rõ để phân biệt một hệ thống lab production-like với một production platform có HA, backup và disaster recovery hoàn chỉnh.
