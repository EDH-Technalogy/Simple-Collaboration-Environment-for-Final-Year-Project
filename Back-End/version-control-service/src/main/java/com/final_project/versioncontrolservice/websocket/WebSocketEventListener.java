package com.final_project.versioncontrolservice.websocket;
import com.final_project.versioncontrolservice.service.WebSocketNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.*;

import java.util.Map;

@Component
public class WebSocketEventListener {

    @Autowired
    private WebSocketNotificationService notificationService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        System.out.println("WebSocket Connected: " + username);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();

        if (sessionAttributes != null) {
            String username = (String) sessionAttributes.get("username");
            System.out.println("WebSocket Disconnected: " + username);

            // Clean up - remove user from any repos they were viewing
            // In production, you'd track which repos the user was viewing
        }
    }

    @EventListener
    public void handleSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination();
        System.out.println("Subscribed to: " + destination);
    }

    @EventListener
    public void handleUnsubscribeEvent(SessionUnsubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination();
        System.out.println("Unsubscribed from: " + destination);
    }
}
//// Add WebSocket notifications to PullRequestController
//
//@Autowired
//private WebSocketNotificationService notificationService;
//
//// Update create method
//@PostMapping(path = "/repos/{owner}/{repo}/pulls", ...)
//public ResponseEntity<PullRequestResponse> create(...) {
//    // ... existing code ...
//
//    PullRequest pr = pullRequestApplicationService.create(...);
//
//    // Send WebSocket notification
//    PullRequestEvent prEvent = PullRequestEvent.builder()
//            .action("opened")
//            .pullRequest(PullRequestInfo.builder()
//                    .id(pr.getId().toHexString())
//                    .title(pr.getTitle())
//                    .body(pr.getDescription())
//                    .state("open")
//                    .sourceBranch(pr.getSourceBranch())
//                    .targetBranch(pr.getTargetBranch())
//                    .author(UserInfo.builder().username(user.getUsername()).build())
//                    .build())
//            .repository(RepositoryInfo.builder()
//                    .name(repo)
//                    .owner(owner)
//                    .fullName(owner + "/" + repo)
//                    .build())
//            .sender(UserInfo.builder().username(user.getUsername()).build())
//            .build();
//
//    notificationService.notifyPullRequest(owner, repo, prEvent);
//
//    return ResponseEntity.status(HttpStatus.CREATED).body(PullRequestResponse.from(pr));
//}


//// Add to the existing RepositoryController class:
//
//@Autowired
//private WebSocketNotificationService notificationService;
//
//// Update the updateBranch method to send WebSocket notification
//@PostMapping(
//        path = "/repos/{owner}/{repo}/refs/heads/{branch}",
//        consumes = MediaType.APPLICATION_JSON_VALUE,
//        produces = MediaType.APPLICATION_JSON_VALUE
//)
//public UpdateBranchResponse updateBranch(
//        @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
//        @PathVariable String owner,
//        @PathVariable String repo,
//        @PathVariable String branch,
//        @RequestBody UpdateBranchBody body
//) {
//    UserDocument user = authService.requireUser(authorization);
//    var meta = vicRepositoryService.loadMeta(owner, repo);
//
//    if (!RepoAccessRules.canWrite(meta, user.getUsername())) {
//        throw new ForbiddenException("forbidden");
//    }
//
//    if (body == null || body.hash() == null || body.hash().isBlank()) {
//        throw new BadRequestException("hash is required");
//    }
//
//    // Get old hash before update
//    String oldHash = meta.getBranchHeads().getOrDefault(branch, "");
//
//    vicRepositoryService.updateBranchRef(meta, branch, body.hash().trim());
//
//    // Send WebSocket notification
//    PushEvent pushEvent = PushEvent.builder()
//            .ref("refs/heads/" + branch)
//            .before(oldHash)
//            .after(body.hash().trim())
//            .created(oldHash.isEmpty())
//            .deleted(false)
//            .forced(false)
//            .repository(RepositoryInfo.builder()
//                    .name(repo)
//                    .owner(owner)
//                    .fullName(owner + "/" + repo)
//                    .build())
//            .pusher(PusherInfo.builder()
//                    .name(user.getUsername())
//                    .email(user.getEmail())
//                    .build())
//            .build();
//
//    notificationService.notifyPush(owner, repo, pushEvent);
//
//    return new UpdateBranchResponse("updated", branch.trim());
//}
